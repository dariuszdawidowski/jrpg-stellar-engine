const assert = require('node:assert/strict');
const { mkdtemp, mkdir, readFile, readdir, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const { join } = require('node:path');
const test = require('node:test');
const { build } = require('../build.js');

async function createBuildFixture(source) {
    const rootDir = await mkdtemp(join(os.tmpdir(), 'jrpg-engine-build-'));
    await mkdir(join(rootDir, 'src'), { recursive: true });
    await writeFile(join(rootDir, 'template.ejs'), '<%- await minjs("src/module.js") %>', 'utf8');
    await writeFile(join(rootDir, 'src', 'module.js'), source, 'utf8');
    return rootDir;
}

const fixtureFiles = [{ src: 'template.ejs', dst: 'bundle.js' }];

test('build writes a completed bundle to the configured output path', async () => {
    const rootDir = await createBuildFixture('globalThis.buildValue = 42;');

    try {
        await build({ rootDir, buildFiles: fixtureFiles });

        const output = await readFile(join(rootDir, 'dist', 'bundle.js'), 'utf8');
        assert.match(output, /buildValue=42/);
        assert.deepEqual(await readdir(join(rootDir, 'dist')), ['bundle.js']);
    } finally {
        await rm(rootDir, { recursive: true, force: true });
    }
});

test('build rejects minification errors and preserves the previous bundle', async () => {
    const rootDir = await createBuildFixture('const = ;');
    const outputPath = join(rootDir, 'dist', 'bundle.js');
    await mkdir(join(rootDir, 'dist'), { recursive: true });
    await writeFile(outputPath, 'previous bundle', 'utf8');

    try {
        await assert.rejects(build({ rootDir, buildFiles: fixtureFiles }), /Error minifying js src\/module\.js/);
        assert.equal(await readFile(outputPath, 'utf8'), 'previous bundle');
        assert.deepEqual(await readdir(join(rootDir, 'dist')), ['bundle.js']);
    } finally {
        await rm(rootDir, { recursive: true, force: true });
    }
});