const assert = require('node:assert/strict');
const { cp, mkdtemp, rm } = require('node:fs/promises');
const os = require('node:os');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { build } = require('../build.js');

test('Pathfinder and SpatialGrid are exported from CommonJS and browser bundles', async () => {
    const repoRoot = join(__dirname, '..');
    const rootDir = await mkdtemp(join(os.tmpdir(), 'jrpg-engine-api-'));

    try {
        await cp(join(repoRoot, 'jrpg-stellar-engine.js.ejs'), join(rootDir, 'jrpg-stellar-engine.js.ejs'));
        await cp(join(repoRoot, 'src'), join(rootDir, 'src'), { recursive: true });
        await build({ rootDir });

        const bundlePath = join(rootDir, 'dist', 'jrpg-stellar-engine.js');
        const commonJsApi = require(bundlePath);
        assert.equal(typeof commonJsApi.Pathfinder, 'function');
        assert.equal(typeof commonJsApi.SpatialGrid, 'function');

        const browserGlobal = {};
        vm.runInNewContext(await require('node:fs/promises').readFile(bundlePath, 'utf8'), browserGlobal);
        assert.equal(typeof browserGlobal.Pathfinder, 'function');
        assert.equal(typeof browserGlobal.SpatialGrid, 'function');
    } finally {
        await rm(rootDir, { recursive: true, force: true });
    }
});