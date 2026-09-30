const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourceRoot = join(__dirname, '..', 'src');
const sourceFiles = ['utils.js', 'loader-tsx.js', 'loader-tmx.js'];

function createLoaders(document) {
    class MockDOMParser {
        parseFromString() {
            return document;
        }
    }

    const context = vm.createContext({ DOMParser: MockDOMParser, URL });
    for (const file of sourceFiles) {
        vm.runInContext(readFileSync(join(sourceRoot, file), 'utf8'), context);
    }

    return {
        tmx: vm.runInContext('new LoaderTMX()', context),
        tsx: vm.runInContext('new LoaderTSX()', context)
    };
}

function createDocument({ rootName, root, parserError = null }) {
    return {
        querySelector(selector) {
            if (selector === 'parsererror') return parserError;
            if (selector === 'map > properties') return null;
            if (selector === rootName) return root;
            return null;
        }
    };
}

function createNode(attributes = {}, children = {}) {
    return {
        getAttribute: name => attributes[name] ?? null,
        querySelector: name => children[name] ?? null,
        querySelectorAll: () => []
    };
}

test('TMX parsing reports malformed XML with source context', async () => {
    const { tmx } = createLoaders(createDocument({
        parserError: { textContent: 'unexpected closing tag' }
    }));

    await assert.rejects(
        tmx.parseLevel({ xml: '<map>', url: '/maps/broken.tmx' }),
        /Invalid XML in \/maps\/broken\.tmx: unexpected closing tag/
    );
});

test('TMX parsing reports a missing map root before constructing the level', async () => {
    const { tmx } = createLoaders(createDocument({ rootName: 'tileset' }));

    await assert.rejects(tmx.parseLevel({ xml: '<tileset/>', url: '/maps/wrong-root.tmx' }), /missing <map> element/);
});

test('TMX parsing rejects invalid tile dimensions with an actionable error', async () => {
    const root = createNode({ tilewidth: '16', tileheight: '0' });
    const { tmx } = createLoaders(createDocument({ rootName: 'map', root }));

    await assert.rejects(
        tmx.parseLevel({ xml: '<map/>', url: '/maps/invalid-size.tmx' }),
        /<map> requires a positive integer "tileheight"/
    );
});

test('TSX parsing reports a missing tileset root instead of returning null', async () => {
    const { tsx } = createLoaders(createDocument({ rootName: 'map', root: createNode() }));

    await assert.rejects(
        tsx.parseTileSet({ xml: '<map/>', url: '/tiles/wrong-root.tsx' }),
        /missing <tileset> element/
    );
});

test('TSX parsing rejects a missing image element', async () => {
    const root = createNode({ tilewidth: '16' });
    const { tsx } = createLoaders(createDocument({ rootName: 'tileset', root }));

    await assert.rejects(
        tsx.parseTileSet({ xml: '<tileset/>', url: '/tiles/no-image.tsx' }),
        /missing <image> element/
    );
});

test('TSX parsing rejects invalid image dimensions', async () => {
    const image = createNode({ source: 'atlas.png', width: '0', height: '32' });
    const root = createNode({ tilewidth: '16' }, { image });
    const { tsx } = createLoaders(createDocument({ rootName: 'tileset', root }));

    await assert.rejects(
        tsx.parseTileSet({ xml: '<tileset/>', url: '/tiles/invalid-size.tsx' }),
        /<image> requires a positive integer "width"/
    );
});