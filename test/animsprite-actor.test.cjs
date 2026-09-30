const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourceRoot = join(__dirname, '..', 'src');

function loadActors() {
    const context = vm.createContext({ Math, Number, Object, Error, EPSILON: 0.00001 });
    for (const file of ['sprite.js', 'animsprite.js', 'actor.js']) {
        vm.runInContext(readFileSync(join(sourceRoot, file), 'utf8'), context);
    }
    return context;
}

function actorArgs(overrides = {}) {
    return {
        width: 32,
        height: 16,
        cols: 2,
        rows: 1,
        animations: {},
        ...overrides
    };
}

test('AnimSprite converts grid coordinates and advances looping frames', () => {
    const context = loadActors();
    const sprite = vm.runInContext(`new AnimSprite(${JSON.stringify(actorArgs({
        animations: { walk: [{ frame: [1, 0], duration: 100 }, { frame: [0, 0], duration: 100 }] }
    }))})`, context);

    sprite.anim.play('walk');
    assert.equal(sprite.anim.frame(), 1);
    sprite.update(0.1);
    assert.equal(sprite.anim.frame(), 0);
    sprite.update(0.1);
    assert.equal(sprite.anim.frame(), 1);
});

test('AnimSprite respects priority and stops non-looping animations', () => {
    const context = loadActors();
    const sprite = vm.runInContext(`new AnimSprite(${JSON.stringify(actorArgs({
        animations: {
            idle: [{ frame: 2, duration: 100 }],
            attack: [{ frame: 3, duration: 100 }]
        }
    }))})`, context);

    sprite.anim.play('attack', false, 5);
    sprite.anim.play('idle', true, 4);
    assert.equal(sprite.anim.name, 'attack');
    sprite.update(0.1);
    assert.equal(sprite.anim.name, null);
    assert.equal(sprite.anim.frame(), 0);
});

test('Actor normalizes movement, preserves facing, and identifies direction buckets', () => {
    const context = loadActors();
    const actor = vm.runInContext(`new Actor(${JSON.stringify(actorArgs())})`, context);

    actor.transform.vec.set(3, 4);
    assert.equal(actor.transform.vec.x, 0.6);
    assert.equal(actor.transform.vec.y, 0.8);
    assert.equal(actor.transform.vec.isRight, true);
    assert.equal(actor.getFacing(), 'right');

    actor.idle();
    assert.equal(actor.transform.vec.isZero, true);
    assert.equal(actor.transform.vec.dir.y, 0.8);
    actor.transform.vec.set(0, -1);
    assert.equal(actor.getFacing(), 'up');
});

test('Actor mounts and unmounts children while syncing their transform', () => {
    const context = loadActors();
    const actor = vm.runInContext(`new Actor(${JSON.stringify(actorArgs({ transform: { x: 10, y: 20 } }))})`, context);
    const child = { transform: { x: 0, y: 0, rotation: null }, mountParent: null };
    const offsets = { right: { x: 3, y: -2, rotate: true, angle: 90, behind: true } };

    actor.transform.vec.set(1, 0);
    actor.mount('hand', child, offsets);
    actor._syncMounts();

    assert.equal(actor.getMount('hand'), child);
    assert.equal(child.mountParent, actor);
    assert.equal(child.transform.x, 13);
    assert.equal(child.transform.y, 18);
    assert.deepEqual({ ...child.transform.rotation }, { angle: 90, offsetX: 0, offsetY: 0 });
    assert.equal(actor.unmount('hand'), child);
    assert.equal(actor.getMount('hand'), null);
    assert.equal(child.mountParent, null);
});