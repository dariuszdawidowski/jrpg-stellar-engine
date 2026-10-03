const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const spatialGridSource = readFileSync(join(__dirname, '..', 'src', 'spatial-grid.js'), 'utf8');

function createSpatialGrid(colliders, cellSize = 16) {
    const context = vm.createContext({ colliders, cellSize });
    vm.runInContext(spatialGridSource, context);
    return vm.runInContext('new SpatialGrid(colliders, cellSize)', context);
}

test('SpatialGrid queries overlapping cells once and preserves collider order', () => {
    const colliders = [
        { left: 10, top: 0, right: 20, bottom: 10 },
        { left: 15, top: 0, right: 35, bottom: 10 },
        { left: 100, top: 100, right: 110, bottom: 110 }
    ];
    const grid = createSpatialGrid(colliders);

    const result = grid.query({ left: 16, top: 1, right: 17, bottom: 2 });

    assert.equal(result.length, 2);
    assert.equal(result[0], colliders[0]);
    assert.equal(result[1], colliders[1]);
});

test('SpatialGrid handles negative coordinates and colliders touching cell boundaries', () => {
    const colliders = [
        { left: -16, top: -16, right: 0, bottom: 0 },
        { left: 16, top: 0, right: 32, bottom: 16 }
    ];
    const grid = createSpatialGrid(colliders);

    const negative = grid.query({ left: 0, top: -1, right: 0, bottom: 0 });
    const boundary = grid.query({ left: 16, top: 1, right: 16, bottom: 2 });

    assert.equal(negative.length, 1);
    assert.equal(negative[0], colliders[0]);
    assert.equal(boundary.length, 1);
    assert.equal(boundary[0], colliders[1]);
});

test('SpatialGrid rebuild reflects in-place collider list changes', () => {
    const colliders = [{ left: 0, top: 0, right: 4, bottom: 4 }];
    const grid = createSpatialGrid(colliders);
    const added = { left: 32, top: 32, right: 36, bottom: 36 };
    colliders.push(added);

    grid.rebuild(colliders);

    const result = grid.query({ left: 32, top: 32, right: 36, bottom: 36 });
    assert.equal(result.length, 1);
    assert.equal(result[0], added);
});

test('SpatialGrid rejects invalid cell sizes', () => {
    const context = vm.createContext({});
    vm.runInContext(spatialGridSource, context);

    assert.throws(() => vm.runInContext('new SpatialGrid([], 0)', context), /positive finite number/);
});