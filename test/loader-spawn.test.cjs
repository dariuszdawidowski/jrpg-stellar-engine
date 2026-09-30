const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourceRoot = join(__dirname, '..', 'src');
const sourceFiles = ['utils.js', 'loader-tsx.js', 'loader-tmx.js'];

function createSpawnMap() {
    const actorProperty = {
        getAttribute: name => ({ name: 'actor', type: 'string', value: '/actors/hero.acx' })[name] ?? null,
        querySelectorAll: () => []
    };
    const properties = { querySelectorAll: () => [actorProperty] };
    const object = {
        getAttribute: name => ({ name: 'hero', type: 'spawn', x: '10', y: '20' })[name] ?? null,
        hasAttribute: () => false,
        querySelector: name => name === 'properties' ? properties : null
    };
    const objectGroup = {
        nodeType: 1,
        nodeName: 'objectgroup',
        getAttribute: name => name === 'name' ? 'objects' : null,
        hasAttribute: () => false,
        querySelector: () => null,
        querySelectorAll: () => [object]
    };
    const root = {
        getAttribute: name => ({ tilewidth: '16', tileheight: '16' })[name] ?? null,
        childNodes: [objectGroup]
    };

    return {
        querySelector(selector) {
            if (selector === 'parsererror') return null;
            if (selector === 'map') return root;
            if (selector === 'map > properties') return null;
            return null;
        }
    };
}

function createLoader() {
    let finishSpawn;
    let markSpawnStarted;
    const spawnStarted = new Promise(resolve => {
        markSpawnStarted = resolve;
    });

    class MockDOMParser {
        parseFromString() {
            return createSpawnMap();
        }
    }

    class MockLevel {
        constructor() {
            this.layers = [];
            this.tile = {};
            this.properties = {};
            this.spawnpoints = {};
            this.spawnArgs = [];
            MockLevel.instance = this;
        }

        spawn(args) {
            this.spawnArgs.push(args);
            markSpawnStarted();
            return new Promise(resolve => {
                finishSpawn = () => {
                    const actor = { id: 'hero-1' };
                    this.layers.find(layer => layer.name === args.layer).actors.push(actor);
                    resolve(actor);
                };
            });
        }
    }

    class MockSpawnPoint {
        constructor(args) {
            Object.assign(this, args);
        }
    }

    const context = vm.createContext({
        DOMParser: MockDOMParser,
        Level: MockLevel,
        Node: { ELEMENT_NODE: 1 },
        SpawnPoint: MockSpawnPoint,
        URL,
        fetch: async () => ({ ok: true, text: async () => '<actor />' })
    });
    for (const file of sourceFiles) {
        vm.runInContext(readFileSync(join(sourceRoot, file), 'utf8'), context);
    }

    return {
        loader: vm.runInContext('new LoaderTMX()', context),
        spawnStarted,
        finishSpawn: () => finishSpawn(),
        getLevel: () => MockLevel.instance
    };
}

test('parseLevel waits for spawned actors before resolving', async () => {
    const { loader, spawnStarted, finishSpawn, getLevel } = createLoader();
    let parseResolved = false;
    const levelPromise = loader.parseLevel({ xml: '<map />', url: '/maps/test.tmx' });
    levelPromise.then(() => {
        parseResolved = true;
    });

    await spawnStarted;
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(parseResolved, false);

    finishSpawn();
    const level = await levelPromise;

    assert.equal(level, getLevel());
    assert.equal(level.layers[0].actors[0].id, 'hero-1');
    assert.equal(level.spawnArgs[0].actor.xml, '<actor />');
});