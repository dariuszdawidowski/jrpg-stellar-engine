const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const levelSource = readFileSync(join(__dirname, '..', 'src', 'level.js'), 'utf8');

function createLevel() {
    const context = vm.createContext({
        Lighting: class {},
        LoaderACX: class {}
    });
    vm.runInContext(levelSource, context);
    return vm.runInContext('new Level({})', context);
}

function createTileset(name, calls) {
    return {
        getColliders(map, offsetX, offsetY, first, margin) {
            calls.push({ name, map, offsetX, offsetY, first, margin });
            const colliders = [];
            map.forEach((row, y) => row.forEach((gid, x) => {
                if (gid >= first) colliders.push({ name, gid, x, y });
            }));
            return colliders;
        }
    };
}

test('getColliders assigns each GID to the correct tileset range', () => {
    const level = createLevel();
    const calls = [];
    level.tilesets.set('later', { ref: createTileset('later', calls), first: 100 });
    level.tilesets.set('earlier', { ref: createTileset('earlier', calls), first: 1 });
    level.layers.push({ class: 'colliders', map: [[1, 100, 2, 101, 0]] });

    const colliders = level.getColliders();

    assert.equal(calls.length, 2);
    assert.equal(calls[0].name, 'earlier');
    assert.deepEqual(Array.from(calls[0].map[0]), [1, 0, 2, 0, 0]);
    assert.equal(calls[1].name, 'later');
    assert.deepEqual(Array.from(calls[1].map[0]), [0, 100, 0, 101, 0]);
    assert.deepEqual(
        Array.from(colliders, collider => [collider.name, collider.gid, collider.x]),
        [['earlier', 1, 0], ['earlier', 2, 2], ['later', 100, 1], ['later', 101, 3]]
    );
});

test('getColliders preserves single-tileset behavior and ignores empty GIDs', () => {
    const level = createLevel();
    const calls = [];
    level.tilesets.set('only', { ref: createTileset('only', calls), first: 1 });
    level.layers.push({ class: 'colliders', map: [[0, 1, 2]] });

    const colliders = level.getColliders();

    assert.equal(calls.length, 1);
    assert.deepEqual(Array.from(calls[0].map[0]), [0, 1, 2]);
    assert.deepEqual(Array.from(colliders, collider => collider.gid), [1, 2]);
});