# Project Architecture

Use this as a starting point for a new browser game, not as a mandatory scaffold. Prefer the smallest structure that keeps the runtime, game rules, content, and presentation understandable.

## Runtime Boundary

JRPG Stellar Engine is a browser Canvas engine. Its rendering and loaders depend on browser APIs such as `document`, `Image`, `fetch`, and canvas contexts. Use Node.js for package management, Vite, build scripts, tests, and any separately justified server. Do not treat the engine as a Node-side renderer.

The engine README documents a browser-global build and CommonJS `require()`. It does not document native ESM exports. Before choosing an integration:

1. Inspect the installed package version, package entry, distribution files, and local lockfile.
2. Create the smallest Vite consumer entry that constructs or references one engine class.
3. Run both the Vite development server and production build; if integration fails, use a supported distribution/global adapter or address packaging only when in scope.
4. Keep engine-specific integration behind a small module so application code does not depend on guessed import behavior.

Do not add a backend by default. Add one when requirements need authoritative shared state, accounts, matchmaking, persistence unavailable in the browser, or other server-owned behavior.

## Suggested Boundaries

Example layout; adapt to repository conventions and project size:

```text
index.html
public/
  assets/
    actors/
    audio/
    images/
    maps/
    tilesets/
src/
  main.js
  app/
    create-game.js
    game-loop.js
  engine/
    engine-adapter.js
    level-loader.js
  input/
    controls.js
  game/
    state.js
    actors/
    systems/
    scenes/
  ui/
```

Keep `main.js` as composition/bootstrap: find the canvas, create the view and services, await initial resources, establish the initial game state, and start the loop. Let focused modules own input mapping, scene/level transitions, game rules, actor behavior, and UI. Avoid both a single file containing the whole game and needless abstraction for a tiny prototype.

For Vite's `public/` assets, use stable browser URLs such as `/assets/maps/start.tmx`; keep TMX references to TSX files and TSX references to images valid relative to their containing files. Check the actual deployment base path before hard-coding root-absolute URLs. Alternatively, use Vite-managed asset imports only after proving the engine's XML path resolution remains correct in dev and built output.

## Lifecycle

Use an explicit asynchronous startup sequence:

1. Create the browser view and engine-facing services.
2. Load the initial level and required assets; surface failure rather than starting into a blank or partially initialized scene.
3. Create or attach the player and initialize input/state references.
4. Start a single `requestAnimationFrame` loop.
5. Per frame, derive a bounded delta time in seconds, update game rules and engine level state, clear/render the view, then render companion UI in the intended order.
6. On level changes or shutdown, cancel or invalidate pending asynchronous work and detach old listeners/resources where the application owns them.

Keep state transitions explicit. Prevent duplicate frame loops during scene changes, and avoid using a stale level/player reference after asynchronous loading.

## Quality Bar

- Keep content files independent from code and use stable IDs/properties to connect them.
- Keep browser-specific engine calls at the game/runtime boundary; keep game rules testable where practical.
- Use readable module names and a clear single owner for each mutable piece of state.
- Validate a production build and the actual deployed URL/base path, not just the Vite dev server.

## Build and Release Boundaries

Read [build target notes](./build-targets.md) before adding deployment scripts. Keep the web build as the shared source artifact, then run separate platform-specific packaging or native-build stages. Do not combine Steam uploads or mobile signing with the ordinary web build.

- Web: Vite creates the deployable static site.
- Desktop: Electron packages the web runtime; build Windows and macOS on their respective native hosts. Linux is optional unless requested.
- Steam: SteamPipe maps already-built platform files into depots. It is distribution, not an Electron target or installer maker.
- Mobile: Capacitor copies the Vite output into native projects, then Xcode/Android tooling produces signed release artifacts.

Build scripts must preserve existing outputs unless an explicit destructive option such as `--clean` is passed. Build into a temporary sibling directory first when replacing release staging, validate source and target paths, and only swap directories after a complete successful copy.

## References in This Workspace

- Engine distribution/runtime: `jrpg-stellar-engine/README.md`, `jrpg-stellar-engine/package.json`, `jrpg-stellar-engine/jrpg-stellar-engine.js.ejs`.
- When studying any existing game, distinguish reusable gameplay boundaries from project-specific globals, development bootstraps, and deployment assumptions.