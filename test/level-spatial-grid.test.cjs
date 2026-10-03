const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const levelSource = readFileSync(join(__dirname, '..', 'src', 'level.js'), 'utf8');
const spatialGridSource = readFileSync(join(__dirname, '..', 'src', 'spatial-grid.js'), 'utf8');

function createLevel() {
    const context = vm.createContext({
        Lighting: class {},
        LoaderACX: class {}
    });
    vm.runInContext(spatialGridSource, context);
    vm.runInContext(levelSource, context);
    return vm.runInContext('new Level({ colliderGridCellSize: 16 })', context);
}

test('Level caches its collider grid and rebuilds it after explicit invalidation', () => {
    const level = createLevel();
    const first = { left: 0, top: 0, right: 8, bottom: 8 };
    const second = { left: 32, top: 32, right: 40, bottom: 40 };
    level.colliders = [first];

    const initialGrid = level.getColliderGrid();
    assert.equal(level.getColliderGrid(), initialGrid);
    assert.equal(initialGrid.query(first).length, 1);

    level.colliders.push(second);
    level.invalidateColliderGrid();
    const rebuiltGrid = level.getColliderGrid();

    assert.notEqual(rebuiltGrid, initialGrid);
    assert.equal(rebuiltGrid.query(second).length, 1);
});

test('Level rebuilds its collider grid when the cell size changes', () => {
    const level = createLevel();
    level.colliders = [];
    const initialGrid = level.getColliderGrid();

    const resizedGrid = level.getColliderGrid(32);

    assert.notEqual(resizedGrid, initialGrid);
    assert.equal(resizedGrid.cellSize, 32);
    assert.equal(level.getColliderGrid(), resizedGrid);
});