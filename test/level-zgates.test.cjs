const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const levelSource = readFileSync(join(__dirname, '..', 'src', 'level.js'), 'utf8');

function box4Box(a, b) {
    return !(
        a.right < b.left
        || a.left > b.right
        || a.bottom < b.top
        || a.top > b.bottom
    );
}

function createLevel() {
    const context = vm.createContext({
        Lighting: class {},
        LoaderACX: class {},
        box4Box
    });
    vm.runInContext(levelSource, context);
    return vm.runInContext('new Level({})', context);
}

function makeActor(y, mountOverrides = {}) {
    return {
        transform: { y },
        origin: { y: 0 },
        tile: { scaled: { halfHeight: 0 } },
        mountOverrides,
        getMask() {
            return { left: 0, top: y, right: 10, bottom: y };
        }
    };
}

test('applyZGates keeps non-deferred actors in original relative order', () => {
    const level = createLevel();
    level.zgates = [];
    const a = makeActor(0);
    const b = makeActor(10);
    const c = makeActor(20);
    const actors = [a, b, c];

    level.applyZGates(actors);

    assert.deepEqual(actors, [a, b, c]);
});

test('applyZGates moves actors past a gate into deferredActors and compacts the rest in place', () => {
    const level = createLevel();
    level.zgates = [{ layer: 'cover', anchorY: 5, scope: 'actor', left: -100, top: -100, right: 100, bottom: 100 }];
    const below = makeActor(0); // baselineY (0) < anchorY (5) - unaffected
    const above1 = makeActor(10); // deferred
    const above2 = makeActor(20); // deferred
    const actors = [below, above1, above2];

    level.applyZGates(actors);

    assert.equal(actors.length, 1);
    assert.equal(actors[0], below);
    assert.equal(level.deferredActors.cover.length, 2);
    assert.equal(level.deferredActors.cover[0], above1);
    assert.equal(level.deferredActors.cover[1], above2);
});

test('applyZGates sets a mount slot override without deferring the actor', () => {
    const level = createLevel();
    level.zgates = [{ layer: 'cover', anchorY: 0, scope: 'mount:hand', left: -100, top: -100, right: 100, bottom: 100 }];
    const actor = makeActor(10);
    const actors = [actor];

    level.applyZGates(actors);

    assert.equal(actors.length, 1);
    assert.equal(actors[0], actor);
    assert.equal(actor.mountOverrides.hand, true);
    assert.equal(Object.keys(level.deferredActors).length, 0);
});
