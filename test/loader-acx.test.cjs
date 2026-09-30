const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadLoader() {
    const context = vm.createContext({ console, Math, Number, Object, Error });
    for (const file of ['utils.js', 'loader-acx.js']) {
        vm.runInContext(readFileSync(join(__dirname, '..', 'src', file), 'utf8'), context);
    }
    return context;
}

function element(attributes = {}, children = {}) {
    return {
        getAttribute: name => attributes[name] ?? null,
        hasAttribute: name => name in attributes,
        querySelector: selector => children[selector] || null,
        querySelectorAll: selector => children[selector] || []
    };
}

test('LoaderACX parses scaled actor data including properties, animations and mounts', () => {
    const context = loadLoader();
    const properties = element({}, {
        property: [
            element({ name: 'rarity', value: 'rare' }),
            element({ name: 'hp', type: 'int', value: '12' })
        ]
    });
    const movement = element({ speed: '30' });
    const collider = element({ x: '-2', y: '1', width: '10', height: '12' });
    const animation = element({ name: 'walk' }, {
        frame: [
            element({ tileid: '0', duration: '100' }),
            element({ tileid: '1', duration: '120' })
        ]
    });
    const rightMount = element({ x: '4', y: '-3', angle: '90', rotate: 'true', behind: 'false' });
    const mount = element({ name: 'weapon' }, { right: rightMount });
    const actor = element({
        version: '0.5',
        name: 'Knight',
        slug: 'knight',
        class: 'Actor',
        resource: '#knight',
        width: '32',
        height: '16',
        cols: '2',
        rows: '1'
    }, {
        properties,
        movement,
        collider,
        animation: [animation],
        'mounts > mount': [mount]
    });

    const loader = vm.runInContext('new LoaderACX()', context);
    const result = loader.parseData({
        id: 'actor-1',
        type: 'npc',
        actor,
        scale: 2,
        transform: { x: 8, y: 10 },
        properties: { hp: 20 }
    });

    assert.equal(result.className, 'Actor');
    assert.equal(result.id, 'actor-1');
    assert.equal(result.type, 'npc');
    assert.equal(result.slug, 'knight');
    assert.deepEqual({ ...result.transform }, { x: 8, y: 10 });
    assert.equal(result.properties.rarity, 'rare');
    assert.equal(result.properties.hp, 20);
    assert.equal(result.properties.spd, 60);
    assert.deepEqual({ ...result.collider }, { x: -4, y: 2, width: 20, height: 24 });
    assert.equal(result.animations.walk[1].duration, 120);
    assert.deepEqual({ ...result.mounts.weapon.right }, {
        x: 8,
        y: -6,
        angle: 90,
        rotate: true,
        behind: false
    });
});

test('LoaderACX rejects unsupported actor data instead of creating partial params', () => {
    const context = loadLoader();
    const loader = vm.runInContext('new LoaderACX()', context);
    const actor = element({ version: '0.1', name: 'Legacy' });

    assert.equal(loader.parseData({ actor, scale: 1, transform: { x: 0, y: 0 } }), undefined);
});