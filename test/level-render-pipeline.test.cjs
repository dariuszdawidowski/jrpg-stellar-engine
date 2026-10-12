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

function makeLayer(name, type = 'image', zband = 0) {
    return { name, type, properties: { zband } };
}

function stubRenderers(level, trace) {
    level.renderImageLayer = (_view, layer) => trace.push(layer.name);
    level.renderObjectsLayer = (_view, layer) => trace.push(layer.name);
}

test('render pipeline prepares actors once and renders repeated layer groups in order', () => {
    const level = createLevel();
    const trace = [];
    let prepared = 0;
    const view = {};
    level.layers = [
        makeLayer('upper', 'image', 20),
        makeLayer('ground', 'objects', 0),
        makeLayer('middle', 'image', 10)
    ];
    level.prepareRenderActors = () => prepared++;
    stubRenderers(level, trace);

    level.render(view, {
        passes: [
            { layers: ['middle', 'ground'] },
            { render: (passView, passLevel) => {
                assert.equal(passView, view);
                assert.equal(passLevel, level);
                trace.push('custom-a');
            } },
            { layers: ['middle', 'upper'] },
            { render: () => trace.push('custom-b') }
        ]
    });

    assert.equal(prepared, 1);
    assert.deepEqual(trace, ['ground', 'middle', 'custom-a', 'middle', 'upper', 'custom-b']);
});

test('render pipeline ends lighting before callbacks and resumes it for later layers', () => {
    const level = createLevel();
    const trace = [];
    level.lights.ambient = { r: 10, g: 10, b: 10 };
    level.layers = [
        makeLayer('first', 'objects', 0),
        makeLayer('second', 'objects', 1)
    ];
    level.prepareRenderActors = () => {};
    level.renderObjectsLayer = (_view, layer) => trace.push(layer.name);
    level.lightRender = {
        begin: () => trace.push('begin'),
        end: () => trace.push('end')
    };

    level.render({}, {
        passes: [
            { layers: ['first'] },
            { render: () => trace.push('custom') },
            { layers: ['second'] }
        ]
    });

    assert.deepEqual(trace, ['begin', 'first', 'end', 'custom', 'begin', 'second', 'end']);
});

test('lit render callbacks share the lighting batch across surrounding layers', () => {
    const level = createLevel();
    const trace = [];
    level.lights.ambient = { r: 10, g: 10, b: 10 };
    level.layers = [
        makeLayer('first', 'objects', 0),
        makeLayer('second', 'objects', 1)
    ];
    level.prepareRenderActors = () => {};
    level.renderObjectsLayer = (_view, layer) => trace.push(layer.name);
    level.lightRender = {
        begin: () => trace.push('begin'),
        end: () => trace.push('end')
    };

    level.render({}, {
        passes: [
            { layers: ['first'] },
            { render: () => trace.push('custom'), lit: true },
            { layers: ['second'] }
        ]
    });

    assert.deepEqual(trace, ['begin', 'first', 'custom', 'second', 'end']);
});

test('render retains all-layer and filtered-layer behavior', () => {
    const level = createLevel();
    const trace = [];
    level.layers = [
        makeLayer('later', 'image', 5),
        makeLayer('earlier', 'image', 0)
    ];
    stubRenderers(level, trace);

    level.render({});
    assert.deepEqual(trace, ['earlier', 'later']);

    trace.length = 0;
    level.render({}, ['later']);
    assert.deepEqual(trace, ['later']);
});

test('render rejects malformed pipeline operations before preparing actors', () => {
    const level = createLevel();
    let prepared = false;
    level.prepareRenderActors = () => prepared = true;

    assert.throws(
        () => level.render({}, { passes: [{ layers: 'ground' }] }),
        { name: 'TypeError', message: 'Each render pass must specify either a layers array or a render callback' }
    );
    assert.equal(prepared, false);
});

test('render rejects non-boolean lighting options on callbacks', () => {
    const level = createLevel();
    assert.throws(
        () => level.render({}, { passes: [{ render() {}, lit: 'yes' }] }),
        { name: 'TypeError', message: 'Each render pass must specify either a layers array or a render callback' }
    );
});
