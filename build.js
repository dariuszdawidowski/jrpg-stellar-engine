/**
 * Build script v6-custom
 */

const files = [
    { src: 'jrpg-stellar-engine.js.ejs', dst: 'jrpg-stellar-engine.js' },
];

const { randomUUID } = require('node:crypto');
const { mkdir, readFile, rename, unlink, writeFile } = require('node:fs/promises');
const { dirname, resolve } = require('node:path');
const ejs = require('ejs');
const { minify } = require('terser');

async function build({ rootDir = __dirname, buildFiles = files, minifier = minify } = {}) {
    const distDir = resolve(rootDir, 'dist');
    await mkdir(distDir, { recursive: true });

    for (const file of buildFiles) {
        const templatePath = resolve(rootDir, file.src);
        const template = await readFile(templatePath, 'utf8');
        const minjs = async filePath => {
            const sourcePath = resolve(rootDir, filePath);
            const inputCode = await readFile(sourcePath, 'utf8');
            let result;
            try {
                result = await minifier(inputCode);
            } catch (error) {
                throw new Error(`Error minifying js ${filePath}: ${error.message}`, { cause: error });
            }
            if (!result || typeof result.code !== 'string') {
                throw new Error(`Error minifying js ${filePath}: minifier returned no code`);
            }
            return result.code;
        };

        const output = await ejs.render(template, { minjs }, { async: true });
        const destination = resolve(distDir, file.dst);
        const temporaryPath = `${destination}.${process.pid}.${randomUUID()}.tmp`;
        try {
            await mkdir(dirname(destination), { recursive: true });
            await writeFile(temporaryPath, output, 'utf8');
            await rename(temporaryPath, destination);
        } catch (error) {
            await unlink(temporaryPath).catch(() => {});
            throw error;
        }
    }
}

if (require.main === module) {
    build().catch(error => {
        console.error('Build failed:', error);
        process.exitCode = 1;
    });
}

module.exports = { build };
