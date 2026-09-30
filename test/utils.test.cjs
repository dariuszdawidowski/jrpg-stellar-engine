const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadUtils() {
    const context = vm.createContext({ Math, Number, URL, Error, Object });
    vm.runInContext(readFileSync(join(__dirname, '..', 'src', 'utils.js'), 'utf8'), context);
    return context;
}

test('roundToNearestEven rounds both odd directions upward to an even value', () => {
    const utils = loadUtils();

    assert.equal(utils.roundToNearestEven(2.1), 2);
    assert.equal(utils.roundToNearestEven(2.6), 4);
    assert.equal(utils.roundToNearestEven(-2.6), -2);
});

test('create2DArray splits a flat array into rows without padding', () => {
    const utils = loadUtils();

    assert.equal(JSON.stringify(utils.create2DArray([1, 2, 3, 4, 5], 2)), JSON.stringify([[1, 2], [3, 4], [5]]));
});

test('resolvePath resolves relative and parent paths from a map URL', () => {
    const utils = loadUtils();

    assert.equal(utils.resolvePath('/maps/world/test.tmx', '../tiles/terrain.tsx'), '/maps/tiles/terrain.tsx');
    assert.equal(utils.resolvePath('/maps/world/test.tmx', '/shared/terrain.tsx'), '/shared/terrain.tsx');
});

test('geometry helpers include touching rectangle and point boundaries', () => {
    const utils = loadUtils();
    const rectangle = { left: 1, top: 2, right: 4, bottom: 6 };

    assert.equal(utils.point4Box({ x: 1, y: 6 }, rectangle), true);
    assert.equal(utils.point4Box({ x: 0, y: 6 }, rectangle), false);
    assert.equal(utils.box4Box(rectangle, { left: 4, top: 6, right: 8, bottom: 9 }), true);
    assert.equal(utils.box4Box(rectangle, { left: 5, top: 2, right: 8, bottom: 6 }), false);
});

test('parseProperties converts supported Tiled property types', () => {
    const utils = loadUtils();
    const properties = {
        querySelectorAll: () => [
            { getAttribute: name => ({ name: 'Title', value: 'castle' })[name] },
            { getAttribute: name => ({ name: 'Enabled', type: 'bool', value: 'true' })[name] },
            { getAttribute: name => ({ name: 'Count', type: 'int', value: '3' })[name] },
            { getAttribute: name => ({ name: 'Tint', type: 'color', value: '#1234ab' })[name] },
            {
                getAttribute: name => ({ name: 'Loot', type: 'list' })[name],
                querySelectorAll: () => [
                    { getAttribute: key => ({ type: 'int', value: '7' })[key] },
                    { getAttribute: key => ({ type: 'bool', value: 'false' })[key] }
                ]
            }
        ]
    };

    const result = utils.parseProperties(properties);

    assert.deepEqual(Object.keys(result).sort(), ['_count', '_enabled', '_loot', '_tint', '_title', 'count', 'enabled', 'loot', 'tint', 'title'].sort());
    assert.equal(result._title, 'castle');
    assert.equal(result.enabled, true);
    assert.equal(result.count, 3);
    assert.equal(JSON.stringify(result.tint), JSON.stringify({ r: 0x12, g: 0x34, b: 0xab }));
    assert.equal(JSON.stringify(result.loot), JSON.stringify([7, false]));
});