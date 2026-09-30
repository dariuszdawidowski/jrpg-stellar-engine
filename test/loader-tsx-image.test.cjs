const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourceRoot = join(__dirname, '..', 'src');
const sourceFiles = ['utils.js', 'loader-tsx.js'];

function createLoader() {
    let markImageCreated;
    const imageCreated = new Promise(resolve => {
        markImageCreated = resolve;
    });
    const revokedUrls = [];
    const appendedImages = [];
    const resourcesDiv = { appendChild: image => appendedImages.push(image) };
    const document = {
        querySelector: () => resourcesDiv,
        createElement: () => resourcesDiv,
        body: { appendChild: () => {} }
    };

    class MockImage {
        constructor() {
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
            this.naturalWidth = 32;
            this.listeners.load();
        }

        fail() {
            this.listeners.error();
        }
    }

    const context = vm.createContext({
        Image: MockImage,
        URL: {
            createObjectURL: () => 'blob:atlas',
            revokeObjectURL: value => revokedUrls.push(value)
        },
        document,
        fetch: async () => ({ ok: true, blob: async () => ({}) })
    });
    for (const file of sourceFiles) {
        vm.runInContext(readFileSync(join(sourceRoot, file), 'utf8'), context);
    }

    return {
        loader: vm.runInContext('new LoaderTSX()', context),
        imageCreated,
        revokedUrls,
        appendedImages
    };
}

test('fetchImage waits for load and revokes its object URL on success', async () => {
    const { loader, imageCreated, revokedUrls, appendedImages } = createLoader();
    let settled = false;
    const imagePromise = loader.fetchImage('/tiles/atlas.png');
    imagePromise.then(() => {
        settled = true;
    });

    const image = await imageCreated;
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(settled, false);
    assert.equal(image.url, 'blob:atlas');
    assert.equal(appendedImages[0], image);

    image.load();
    assert.equal(await imagePromise, image);
    assert.deepEqual(revokedUrls, ['blob:atlas']);
});

test('fetchImage rejects load errors and revokes its object URL', async () => {
    const { loader, imageCreated, revokedUrls } = createLoader();
    const imagePromise = loader.fetchImage('/tiles/broken.png');
    const image = await imageCreated;

    image.fail();
    await assert.rejects(imagePromise, /Failed to load image: \/tiles\/broken\.png/);
    assert.deepEqual(revokedUrls, ['blob:atlas']);
});