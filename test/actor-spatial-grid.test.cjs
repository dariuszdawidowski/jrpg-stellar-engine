const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourceFiles = ['utils.js', 'sprite.js', 'animsprite.js', 'spatial-grid.js', 'actor.js'];

function createContext(colliders) {
    const context = vm.createContext({ colliders });
    for (const file of sourceFiles) {
        const source = readFileSync(join(__dirname, '..', 'src', file), 'utf8');
        vm.runInContext(source, context);
    }
    return context;
}

function createActor(context) {
    return vm.runInContext(`new Actor({
        width: 16,
        height: 16,
        cols: 1,
        rows: 1,
        transform: { x: 8, y: 8 },
        properties: { spd: 600 },
        collider: { x: 0, y: 0, width: 16, height: 16 }
    })`, context);
}

test('Actor.collideGrid matches collide while querying only nearby colliders', () => {
    const nearby = { left: 20, top: 0, right: 40, bottom: 16 };
    const distant = { left: 500, top: 500, right: 520, bottom: 520 };
    const colliders = [nearby, distant];
    const context = createContext(colliders);
    const actor = createActor(context);
    const grid = vm.runInContext('new SpatialGrid(colliders, 16)', context);
    const query = grid.query.bind(grid);
    let queriedColliderCount = null;
    grid.query = rect => {
        const candidates = query(rect);
        queriedColliderCount = candidates.length;
        return candidates;
    };
    actor.transform.vec.set(1, 0);

    const fullScan = actor.collide(colliders, 1 / 60);
    const gridScan = actor.collideGrid(grid, 1 / 60);

    assert.equal(gridScan[0], fullScan[0]);
    assert.equal(gridScan[1], fullScan[1]);
    assert.equal(queriedColliderCount, 1);
});