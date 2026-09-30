const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourceRoot = join(__dirname, '..', 'src');
const sourceFiles = ['utils.js', 'loader-tsx.js', 'loader-tmx.js'];

function createLoader({ imageSource = 'background.png', documentImage = null } = {}) {
    let markImageCreated;
    const imageCreated = new Promise(resolve => {
        markImageCreated = resolve;
    });

    class MockImage {
        constructor() {
            this.complete = false;
            this.naturalWidth = 0;
            this.listeners = {};
            markImageCreated(this);
        }

        addEventListener(name, listener) {
            this.listeners[name] = listener;
        }

        removeEventListener(name) {
            delete this.listeners[name];
        }

        set src(value) {
            this.url = value;
        }

        load() {
            this.complete = true;
            this.naturalWidth = 64;
            this.listeners.load();
        }

        fail() {
            this.complete = true;
            this.listeners.error();
        }
    }

    class MockLevel {
        constructor() {
            this.layers = [];
            this.tile = {};
            this.properties = {};
        }
    }

    const imageNode = {
        getAttribute: name => ({ source: imageSource, width: '64', height: '64' })[name] ?? null
    };
    const imageLayer = {
        nodeType: 1,
        nodeName: 'imagelayer',
        getAttribute: name => name === 'name' ? 'background' : null,
        hasAttribute: () => false,
        querySelector: name => name === 'image' ? imageNode : null
    };
    const root = {
        getAttribute: name => ({ tilewidth: '16', tileheight: '16' })[name] ?? null,
        childNodes: [imageLayer]
    };
    const parsedDocument = {
        querySelector(selector) {
            if (selector === 'parsererror') return null;
            if (selector === 'map') return root;
            if (selector === 'map > properties') return null;
            return null;
        }
    };
    class MockDOMParser {
        parseFromString() {
            return parsedDocument;
        }
    }

    const context = vm.createContext({
        DOMParser: MockDOMParser,
        Image: MockImage,
        Level: MockLevel,
        Node: { ELEMENT_NODE: 1 },
        URL,
        document: { querySelector: () => documentImage }
    });
    for (const file of sourceFiles) {
        vm.runInContext(readFileSync(join(sourceRoot, file), 'utf8'), context);
    }

    return {
        loader: vm.runInContext('new LoaderTMX()', context),
        imageCreated
    };
}

test('parseLevel waits for image layer load before resolving', async () => {
    const { loader, imageCreated } = createLoader();
    let parseResolved = false;
    const levelPromise = loader.parseLevel({ xml: '<map />', url: '/maps/test.tmx', prefetch: false });
    levelPromise.then(() => {
        parseResolved = true;
    });

    const image = await imageCreated;
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(parseResolved, false);

    image.load();
    const level = await levelPromise;

    assert.equal(level.layers.length, 1);
    assert.equal(level.layers[0].src, image);
    assert.equal(image.url, '/maps/background.png');
});

test('parseLevel rejects a failed image layer with its URL', async () => {
    const { loader, imageCreated } = createLoader();
    const levelPromise = loader.parseLevel({ xml: '<map />', url: '/maps/test.tmx', prefetch: false });
    const image = await imageCreated;

    image.fail();
    await assert.rejects(levelPromise, /Failed to load image: \/maps\/background\.png/);
});

test('parseLevel rejects an image layer referencing a missing DOM resource', async () => {
    const { loader } = createLoader({ imageSource: '#background' });

    await assert.rejects(
        loader.parseLevel({ xml: '<map />', url: '/maps/test.tmx', prefetch: false }),
        /references missing resource #background/
    );
});

test('parseLevel waits for an existing DOM image resource to load', async () => {
    const image = {
        complete: false,
        naturalWidth: 0,
        listeners: {},
        addEventListener(name, listener) {
            this.listeners[name] = listener;
        },
        removeEventListener(name) {
            delete this.listeners[name];
        }
    };
    const { loader } = createLoader({ imageSource: '#background', documentImage: image });
    let parseResolved = false;
    const levelPromise = loader.parseLevel({ xml: '<map />', url: '/maps/test.tmx', prefetch: false });
    levelPromise.then(() => {
        parseResolved = true;
    });

    await new Promise(resolve => setImmediate(resolve));
    assert.equal(parseResolved, false);

    image.complete = true;
    image.naturalWidth = 64;
    image.listeners.load();
    const level = await levelPromise;

    assert.equal(level.layers[0].src, image);
});