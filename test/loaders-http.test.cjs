const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourceRoot = join(__dirname, '..', 'src');
const sourceFiles = ['utils.js', 'loader-tsx.js', 'loader-tmx.js'];

function createLoaders(responseForUrl) {
    const requests = [];
    const context = vm.createContext({
        Node: { ELEMENT_NODE: 1 },
        URL,
        fetch: async url => {
            requests.push(url);
            return responseForUrl(url);
        }
    });

    for (const file of sourceFiles) {
        vm.runInContext(readFileSync(join(sourceRoot, file), 'utf8'), context);
    }

    return {
        requests,
        tmx: vm.runInContext('new LoaderTMX()', context),
        tsx: vm.runInContext('new LoaderTSX()', context)
    };
}

function failedResponse(status = 404, statusText = 'Not Found') {
    return {
        ok: false,
        status,
        statusText,
        text() {
            throw new Error('Response body must not be read for HTTP errors');
        },
        blob() {
            throw new Error('Response body must not be read for HTTP errors');
        }
    };
}

test('TMX loadLevel rejects HTTP errors with the requested URL and status', async () => {
    const { tmx, requests } = createLoaders(() => failedResponse());

    await assert.rejects(tmx.loadLevel({ url: '/maps/missing.tmx' }), /\/maps\/missing\.tmx.*404 Not Found/);
    assert.deepEqual(requests, ['/maps/missing.tmx']);
});

test('TSX loadTileSet rejects HTTP errors before parsing the body', async () => {
    const { tsx, requests } = createLoaders(() => failedResponse());

    await assert.rejects(tsx.loadTileSet({ url: '/tiles/missing.tsx' }), /\/tiles\/missing\.tsx.*404 Not Found/);
    assert.deepEqual(requests, ['/tiles/missing.tsx']);
});

test('TMX resource prefetch rejects a missing TSX file', async () => {
    const { tmx, requests } = createLoaders(() => failedResponse());
    const tileset = {
        nodeType: 1,
        nodeName: 'tileset',
        getAttribute: () => 'tiles.tsx'
    };

    await assert.rejects(
        tmx.fetchResources({ childNodes: [tileset] }, '/maps/level.tmx', 1, true),
        /\/maps\/tiles\.tsx.*404 Not Found/
    );
    assert.deepEqual(requests, ['/maps/tiles.tsx']);
});

test('TMX resource prefetch rejects a missing ACX file', async () => {
    const { tmx, requests } = createLoaders(() => failedResponse());
    const spawn = {
        getAttribute: name => name === 'name' ? 'mob:mob.acx' : 'spawn',
        querySelector: () => null
    };
    const objectGroup = {
        nodeType: 1,
        nodeName: 'objectgroup',
        querySelectorAll: () => [spawn]
    };

    await assert.rejects(
        tmx.fetchResources({ childNodes: [objectGroup] }, '/maps/level.tmx', 1, true),
        /mob\.acx.*404 Not Found/
    );
    assert.deepEqual(requests, ['mob.acx']);
});

test('TSX image fetch rejects HTTP errors before reading the blob', async () => {
    const { tsx, requests } = createLoaders(() => failedResponse());

    await assert.rejects(tsx.fetchImage('/images/missing.png'), /\/images\/missing\.png.*404 Not Found/);
    assert.deepEqual(requests, ['/images/missing.png']);
});