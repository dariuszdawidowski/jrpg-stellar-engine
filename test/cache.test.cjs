const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const cacheSource = readFileSync(join(__dirname, '..', 'src', 'cache.js'), 'utf8');

function createCache() {
    const failures = new Set();

    class MockImage {
        static instances = [];

        constructor() {
            MockImage.instances.push(this);
        }

        set src(value) {
            this.url = value;
            queueMicrotask(() => {
                if (failures.delete(value)) this.onerror();
                else this.onload();
            });
        }
    }

    const context = vm.createContext({ Image: MockImage, Promise, Object, Map, Error });
    vm.runInContext(cacheSource, context);

    return {
        cache: vm.runInContext('Cache', context),
        failures,
        MockImage
    };
}

test('shares an in-flight image load for the same URL', async () => {
    const { cache, MockImage } = createCache();

    const first = cache.getImage('/sprite.png');
    const second = cache.getImage('/sprite.png');
    const [firstImage, secondImage] = await Promise.all([first, second]);

    assert.equal(firstImage, secondImage);
    assert.equal(MockImage.instances.length, 1);
});

test('loads URLs that match inherited object property names', async () => {
    const { cache, MockImage } = createCache();

    const image = await cache.getImage('toString');

    assert.equal(image, MockImage.instances[0]);
    assert.equal(cache.images.toString, image);
});

test('removes failed loads so callers can retry', async () => {
    const { cache, failures, MockImage } = createCache();
    failures.add('/retry.png');

    await assert.rejects(cache.getImage('/retry.png'), /Failed to load image: \/retry.png/);
    const image = await cache.getImage('/retry.png');

    assert.equal(image, MockImage.instances[1]);
    assert.equal(MockImage.instances.length, 2);
});

test('clear prevents pending loads from repopulating the cache', async () => {
    const { cache } = createCache();

    const oldLoad = cache.getImage('/sprite.png');
    cache.clear();
    const newLoad = cache.getImage('/sprite.png');
    const [oldImage, newImage] = await Promise.all([oldLoad, newLoad]);

    assert.notEqual(oldImage, newImage);
    assert.equal(cache.images['/sprite.png'], newImage);
});