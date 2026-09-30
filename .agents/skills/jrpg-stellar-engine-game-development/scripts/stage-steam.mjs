#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { cp, lstat, mkdir, realpath, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const usage = `Usage:
  node stage-steam.mjs --platform <windows|macos|linux> --source <packaged-app-dir> --target <steam-content-dir> [--clean]

Creates a new staging directory. If --target already exists, --clean is required
before it can be replaced. The old target is preserved if copying the new source fails.
`;

function parseArgs(args) {
    const options = { clean: false };

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (arg === '--help' || arg === '-h') return null;
        if (arg === '--clean') {
            options.clean = true;
            continue;
        }

        if (!['--platform', '--source', '--target'].includes(arg)) {
            throw new Error(`Unknown option: ${arg}`);
        }

        const value = args[++index];
        if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
        options[arg.slice(2)] = value;
    }

    for (const required of ['platform', 'source', 'target']) {
        if (!options[required]) throw new Error(`Missing required option: --${required}`);
    }

    if (!['windows', 'macos', 'linux'].includes(options.platform)) {
        throw new Error(`Unsupported platform: ${options.platform}`);
    }

    return options;
}

function isWithin(parent, candidate) {
    const relative = path.relative(parent, candidate);
    return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

async function lstatOrNull(target) {
    try {
        return await lstat(target);
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options === null) {
        console.log(usage);
        return;
    }

    const workingDirectory = await realpath(process.cwd());
    const sourceInput = path.resolve(workingDirectory, options.source);
    const sourceInfo = await lstat(sourceInput);
    if (sourceInfo.isSymbolicLink() || !sourceInfo.isDirectory()) {
        throw new Error(`Source must be a real directory: ${sourceInput}`);
    }

    const source = await realpath(sourceInput);
    if (!isWithin(workingDirectory, source) || source === workingDirectory) {
        throw new Error('Source must be inside the current project directory.');
    }

    const targetInput = path.resolve(workingDirectory, options.target);
    const targetParentInput = path.dirname(targetInput);
    if (!isWithin(workingDirectory, targetInput) || targetInput === workingDirectory) {
        throw new Error('Target must be a child path inside the current project directory.');
    }

    await mkdir(targetParentInput, { recursive: true });
    const targetParent = await realpath(targetParentInput);
    const target = path.join(targetParent, path.basename(targetInput));
    if (!isWithin(workingDirectory, target)) {
        throw new Error('Resolved target must remain inside the current project directory.');
    }

    if (isWithin(source, target) || isWithin(target, source)) {
        throw new Error('Source and target directories must not contain or overlap each other.');
    }

    const targetInfo = await lstatOrNull(target);
    if (targetInfo?.isSymbolicLink() || (targetInfo && !targetInfo.isDirectory())) {
        throw new Error(`Target must be a real directory when it exists: ${target}`);
    }
    if (targetInfo && !options.clean) {
        throw new Error(`Target already exists; pass --clean to replace it: ${target}`);
    }

    const token = randomUUID();
    const temporary = path.join(targetParent, `.${path.basename(target)}.staging-${token}`);
    const backup = path.join(targetParent, `.${path.basename(target)}.previous-${token}`);

    try {
        await cp(source, temporary, { recursive: true, force: false, errorOnExist: true });

        if (targetInfo) {
            await rename(target, backup);
            try {
                await rename(temporary, target);
            } catch (error) {
                await rename(backup, target);
                throw error;
            }
            try {
                await rm(backup, { recursive: true, force: false });
            } catch (error) {
                console.warn(`New staging is ready, but previous content remains at ${backup}: ${error.message}`);
            }
        } else {
            await rename(temporary, target);
        }
    } finally {
        await rm(temporary, { recursive: true, force: true });
    }

    console.log(`Staged ${options.platform} build at ${target}`);
}

main().catch(error => {
    console.error(`Steam staging failed: ${error.message}`);
    process.exitCode = 1;
});