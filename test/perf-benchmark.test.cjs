const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const utilsSource = readFileSync(join(__dirname, '..', 'src', 'utils.js'), 'utf8');
const spriteSource = readFileSync(join(__dirname, '..', 'src', 'sprite.js'), 'utf8');
const animspriteSource = readFileSync(join(__dirname, '..', 'src', 'animsprite.js'), 'utf8');
const spatialGridSource = readFileSync(join(__dirname, '..', 'src', 'spatial-grid.js'), 'utf8');
const actorSource = readFileSync(join(__dirname, '..', 'src', 'actor.js'), 'utf8');
const pathfinderSource = readFileSync(join(__dirname, '..', 'src', 'pathfinder.js'), 'utf8');

function createEngineContext() {
    const context = vm.createContext({});
    vm.runInContext(utilsSource, context);
    vm.runInContext(spriteSource, context);
    vm.runInContext(animspriteSource, context);
    vm.runInContext(spatialGridSource, context);
    vm.runInContext(actorSource, context);
    vm.runInContext(pathfinderSource, context);
    return context;
}

function createActor(context, x, y) {
    return vm.runInContext(`new Actor(${JSON.stringify({
        width: 16, height: 16, cols: 1, rows: 1, scale: 1,
        transform: { x, y },
        properties: { spd: 80 },
        collider: { x: 0, y: 0, width: 16, height: 16 }
    })})`, context);
}

// Scatter axis-aligned colliders across a large world, like a level's static collision list
function buildColliders(count, worldSize) {
    const colliders = [];
    for (let i = 0; i < count; i++) {
        const left = Math.random() * worldSize;
        const top = Math.random() * worldSize;
        colliders.push({ left, top, right: left + 16, bottom: top + 16 });
    }
    return colliders;
}

function timeMs(fn) {
    const start = process.hrtime.bigint();
    fn();
    return Number(process.hrtime.bigint() - start) / 1e6;
}

// Compare the full collider scan with the opt-in broad-phase grid.
// Generous threshold - this is a smoke/regression guard, not a strict perf gate (avoids CI flakiness).
test('perf: Actor collision full scan versus spatial grid', () => {
    const context = createEngineContext();
    const colliders = buildColliders(800, 4000);
    context.colliders = colliders;
    const gridBuildElapsed = timeMs(() => {
        vm.runInContext('grid = new SpatialGrid(colliders, 64)', context);
    });
    const grid = context.grid;
    const actors = [];
    for (let i = 0; i < 80; i++) {
        const actor = createActor(context, Math.random() * 4000, Math.random() * 4000);
        actor.transform.vec.set(Math.random() * 2 - 1, Math.random() * 2 - 1);
        actors.push(actor);
    }

    const fullScanElapsed = timeMs(() => {
        for (let frame = 0; frame < 15; frame++) {
            for (const actor of actors) actor.collide(colliders, 1 / 60);
        }
    });
    const gridElapsed = timeMs(() => {
        for (let frame = 0; frame < 15; frame++) {
            for (const actor of actors) actor.collideGrid(grid, 1 / 60);
        }
    });

    console.log(`[perf] Actor collision x${actors.length} actors x${colliders.length} colliders x15 frames: full scan ${fullScanElapsed.toFixed(1)}ms, grid build ${gridBuildElapsed.toFixed(1)}ms, grid query ${gridElapsed.toFixed(1)}ms`);
    assert.ok(fullScanElapsed < 10000, `collide() benchmark took unexpectedly long: ${fullScanElapsed}ms`);
    assert.ok(gridElapsed < 10000, `collideGrid() benchmark took unexpectedly long: ${gridElapsed}ms`);
});

// Baseline reference for Pathfinder A* search cost (Phase D): linear open/closed list scans today.
test('perf: Pathfinder.findPath over a cluttered grid', () => {
    const context = createEngineContext();
    const colliders = buildColliders(120, 600);
    const pathfinder = vm.runInContext(`new Pathfinder(${JSON.stringify({ gridSize: 16, maxSearchDistance: 600 })})`, context);

    const elapsed = timeMs(() => {
        for (let i = 0; i < 6; i++) {
            pathfinder.invalidateSearch();
            const start = { x: Math.random() * 600, y: Math.random() * 600 };
            const end = { x: Math.random() * 600, y: Math.random() * 600 };
            let path = null;
            let guard = 0;
            while (path === null && guard < 100) {
                path = pathfinder.findPath(start, end, colliders, 200);
                guard++;
            }
        }
    });

    console.log(`[perf] Pathfinder.findPath x6 searches over ${colliders.length} colliders: ${elapsed.toFixed(1)}ms`);
    assert.ok(elapsed < 10000, `findPath() benchmark took unexpectedly long: ${elapsed}ms`);
});
