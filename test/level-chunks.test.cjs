const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const levelSource = readFileSync(join(__dirname, '..', 'src', 'level.js'), 'utf8');

test('bakeChunk provides the non-allocating coordinate transform used by Sprite.render', () => {
    const ctx = {};
    const context = vm.createContext({
        Lighting: class {},
        LoaderACX: class {},
        document: {
            createElement() {
                return {
                    width: 0,
                    height: 0,
                    getContext() {
                        return ctx;
                    }
                };
            }
        }
    });
    vm.runInContext(levelSource, context);
    const level = vm.runInContext('new Level({})', context);
    let transformed;
    let firstPoint;
    const tileset = {
        tile: { scaled: { width: 16, height: 16 } },
        anim: {},
        render(view) {
            firstPoint = view.world2ScreenXY(3, 5);
            transformed = [firstPoint.x, firstPoint.y];
            const secondPoint = view.world2ScreenXY(7, 9);
            assert.equal(secondPoint, firstPoint);
            assert.deepEqual([secondPoint.x, secondPoint.y], [7, 9]);
        }
    };
    level.tilesets.set('test', { ref: tileset, first: 1 });
    level.layers.push({ name: 'ground', type: 'tiles', map: [[1]] });

    level.bakeChunk(level.layers[0], 0, 0);

    assert.deepEqual(transformed, [3, 5]);
    assert.equal(level.chunks.get('ground:0:0').dynamic, false);
});