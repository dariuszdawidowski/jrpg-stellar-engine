const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const pathfinderSource = readFileSync(join(__dirname, '..', 'src', 'pathfinder.js'), 'utf8');

function createPathfinder(args = {}) {
    const box4Box = (a, b) => !(
        a.right < b.left
        || a.left > b.right
        || a.bottom < b.top
        || a.top > b.bottom
    );
    const context = vm.createContext({ box4Box });
    vm.runInContext(pathfinderSource, context);
    return vm.runInContext(`new Pathfinder(${JSON.stringify({ gridSize: 1, maxSearchDistance: 4, ...args })})`, context);
}

function pathCost(path) {
    let cost = 0;
    for (let index = 1; index < path.length; index++) {
        const dx = Math.abs(path[index].x - path[index - 1].x);
        const dy = Math.abs(path[index].y - path[index - 1].y);
        cost += dx > 0 && dy > 0 ? 1.4 : 1;
    }
    return cost;
}

test('octile heuristic matches the configured straight and diagonal costs', () => {
    const pathfinder = createPathfinder();

    assert.equal(pathfinder._heuristic({ x: 0, y: 0 }, { x: 4, y: 2 }), 4.8);
});

test('findPath returns the lowest-cost route on an open grid', () => {
    const pathfinder = createPathfinder();
    const path = pathfinder.findPath({ x: 0.5, y: 0.5 }, { x: 3.5, y: 2.5 }, [], 100);

    assert.equal(path.length, 4);
    assert.equal(pathCost(path), 3.8);
});

test('findPath does not move diagonally through two blocked orthogonal cells', () => {
    const pathfinder = createPathfinder({ maxSearchDistance: 3 });
    const blockedCells = [
        { left: 1, top: 0, right: 2, bottom: 1 },
        { left: 0, top: 1, right: 1, bottom: 2 }
    ];
    const path = pathfinder.findPath({ x: 0.5, y: 0.5 }, { x: 1.5, y: 1.5 }, blockedCells, 1000);

    assert.ok(path);
    assert.ok(path.length > 2);
    assert.notDeepEqual(
        [path[0].x, path[0].y, path[1].x, path[1].y],
        [0.5, 0.5, 1.5, 1.5]
    );
});