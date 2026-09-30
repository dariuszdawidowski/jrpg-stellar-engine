---
name: jrpg-stellar-engine-game-development
description: 'Use when creating or extending a 2D JRPG, pixel-art, top-down, or similar game with JRPG Stellar Engine; especially for Vite/Node.js architecture, Canvas, Tiled, asset loading, gameplay, Electron desktop packaging, SteamPipe, Capacitor iOS/Android builds, and release scripts.'
---

# JRPG Stellar Engine Game Development

Build maintainable browser games around JRPG Stellar Engine's actual capabilities. Treat Node.js as project tooling and Vite as the browser development/build pipeline. Add a Node.js backend only when the game needs server-owned state, accounts, multiplayer, or other network services.

## Use This Skill When

- Starting or structuring a 2D browser game with JRPG Stellar Engine.
- Integrating the engine into Vite or resolving runtime, asset, or Tiled loading issues.
- Implementing maps, actors, controls, interactions, combat, inventory, quests, UI, or similar game systems.
- Extending an existing engine-based game while preserving its project conventions.

## Workflow

1. Inspect the target repository before editing: read its agent instructions, `package.json`, entrypoints, asset layout, and the installed engine version. Prefer its actual source and documentation over examples from another version.
2. Identify the browser runtime and build integration. The engine currently documents browser globals and a CommonJS package entry, not native ESM. Prove the chosen Vite integration with both the dev server and production build before building on it. Do not invent named ESM exports or import private source files as a workaround without verifying the dependency and build behavior.
3. For a new game, establish a small playable vertical slice first: canvas, view, externally loaded map and graphics, one controllable actor, a frame loop, and a visible loading/error state. Keep the slice runnable while adding features.
4. Keep application responsibilities in focused modules: bootstrap/lifecycle, asset and level loading, input, game state or scene flow, actor behaviors and systems, and HTML/CSS presentation. Follow existing conventions in an established project; do not impose a rewrite to match a sample layout.
5. Store maps, tilesets, actor definitions, images, audio, and other content as separate files. Load them through URLs and the engine loaders or a verified asset layer. Handle asynchronous readiness and loading failures before starting gameplay.
6. Before using an engine class or method, confirm its current signature and lifecycle in the installed version. Read [engine API notes](./references/engine-api.md) and [asset/Tiled notes](./references/assets-and-tiled.md) as relevant.
7. Use [project architecture notes](./references/project-architecture.md) for project boundaries and [gameplay patterns](./references/gameplay-patterns.md) for modular gameplay design.
8. For deployment or build-script work, follow [build target notes](./references/build-targets.md). Keep web, Electron, SteamPipe, and Capacitor outputs as explicit, separate stages; preserve existing project tooling and require explicit opt-in before replacing staged release content.
9. After each vertical slice or feature, run the narrowest relevant checks. Then start the game in a browser, exercise the affected interaction, inspect console and network errors, and run the relevant production build.

## Non-Negotiable Boundaries

- `example/index.html` in the engine repository is a deliberately simple, monolithic engine demo. Use it to discover or verify API behavior only; do not copy its application architecture.
- Treat developer demos as API references, not production entrypoints. Inline TMX/TSX/ACX, manually ordered script tags, and direct-file launches are not a production Vite pattern.
- Do not embed sprites, maps, tilesets, actor XML, or large game data in HTML or JavaScript when the content can live in separately loaded files.
- Do not assume `fetch()` rejects HTTP 404 responses, that every image layer is loaded when a map promise resolves, or that actor spawns are complete when `LoaderTMX.loadLevel()` returns. Verify readiness against the installed version and the actual level content.
- Do not delete or overwrite existing build, release, or staging output without an explicit clean/replace flag such as `--clean`; validate paths before destructive operations and stage replacements before swapping them into place.
- Never put signing passwords, Steam credentials, API tokens, or provisioning secrets in tracked scripts, command history, or build logs.
- Avoid broad engine changes when an application-level adapter or focused game module is sufficient. Do not change engine APIs or add a backend unless the task requires it.

## Completion Criteria

- The game starts through the documented project command, not `file://`.
- Vite development and production builds resolve the engine and all referenced assets.
- A loaded map renders, the primary game interaction works, and asynchronous setup errors are visible and actionable.
- No unintended 404s, uncaught errors, or missing assets remain in the browser console/network log.
- Each requested platform target has a documented build command and an artifact appropriate to its distribution channel; native builds are verified on supported host toolchains.
- Changes preserve the existing architecture, and the new code is split by responsibility rather than appended to a monolithic entrypoint.