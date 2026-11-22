# Project Architecture

Use this default layout for new games. Respect an established repository layout unless the user requests a migration. Prefer the smallest structure that keeps the runtime, game rules, content, and presentation understandable.

## Runtime Boundary

JRPG Stellar Engine is a browser Canvas engine. Its rendering and loaders depend on browser APIs such as `document`, `Image`, `fetch`, and canvas contexts. Use Node.js for package management, Vite, build scripts, tests, and any separately justified server. Do not treat the engine as a Node-side renderer.

The engine README documents a browser-global build and CommonJS `require()`. It does not document native ESM exports. Before choosing an integration:

1. Inspect the installed package version, package entry, distribution files, and local lockfile.
2. Create the smallest Vite consumer entry that constructs or references one engine class.
3. Run both the Vite development server and production build; if integration fails, use a supported distribution/global adapter or address packaging only when in scope.
4. Keep engine-specific integration behind a small module so application code does not depend on guessed import behavior.

Do not add a backend by default. Add one when requirements need authoritative shared state, accounts, matchmaking, persistence unavailable in the browser, or other server-owned behavior.

## Default Directory Layout

Use TypeScript for new games. Create only directories needed by the requested slice or platforms; do not add empty gameplay systems or native targets just to fill out the tree.

```text
index.html                 - browser entrypoint
assets/                    - static runtime content, Vite publicDir
  audio/                   - samples and music
  images/                  - backgrounds, avatars and system icons
  levels/                  - TMX maps
  sprites/                 - images, TSX and ACX, grouped by theme
assets-src/                - editable source assets, never bundled
src/
  main.ts                  - bootstrap, initialization and scene flow
  loop.ts                  - frame loop and game state
  behaviours/              - actor behaviours
  system/                  - engine adapter, loading, input and other systems
  ui/                      - presentation and widgets
platforms/                 - tracked platform projects and adapters
  electron/                - Electron main process and optional preload
  ios/                     - Capacitor Xcode project
  android/                 - Capacitor Android project
scripts/                   - build, artifact collection and staging helpers
.github/workflows/         - CI when requested
dist/                     - final output, ignored by Git
  web/                     - Vite bundle shared by all targets
  windows/<arch>/          - Windows distribution archives/installers
  macos/<arch>/            - macOS distribution archives/installers
  linux/<arch>/            - optional Linux distribution archives/packages
  ios/                     - exported IPA files
  android/                 - signed APK/AAB files
  steam/<platform>/        - staged desktop depot content
.build/                    - intermediate output, ignored by Git
  electron/                - packaged applications and Forge maker output
.cache/                    - tooling caches, ignored by Git
```

Keep `main.ts` as composition/bootstrap: find the canvas, create the view and services, await required resources, establish the initial state, and start the loop. Let focused modules own input, loading, game rules, actor behaviour and UI. Add more modules as the game grows; do not copy a demo's monolithic architecture.

Configure Vite with `publicDir: 'assets'`, `build.outDir: 'dist/web'`, and a deployment-appropriate `base` (`'./'` supports relative packaged URLs). Vite serves the contents of `assets/` at the application root and copies them into `dist/web/`, without an extra `assets/` prefix. Resolve fetched URLs from `import.meta.env.BASE_URL`; preserve TMX-to-TSX-to-image relative references. See [asset/Tiled notes](./assets-and-tiled.md) for a concrete example.

Record the game's directory tree, Git tracking rules and output ownership in its `AGENTS.md`. Keep README focused on setup, commands and platform prerequisites, with a link to that section instead of a second layout description. The tree above is the skill's canonical layout; build notes describe how tools target those directories.

Track authored assets, shared code, build configuration and platform project sources. Ignore `dist/`, `.build/`, `.cache/`, copied native web bundles, Xcode/Gradle outputs, local settings and signing secrets. Native projects are generated once and then versioned and synchronized, not recreated on every build.

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

- Web: Vite creates `dist/web/`; only that directory belongs to the web build and preview.
- Desktop: Electron uses the adapter in `platforms/electron/`, packages into `.build/electron/`, and collects final artifacts into `dist/<platform>/<arch>/`; build Windows and macOS on their respective native hosts. Linux is optional unless requested.
- Steam: stage packaged desktop applications under `dist/steam/<platform>/`; SteamPipe maps those files into depots. It is distribution, not an Electron target or installer maker.
- Mobile: Capacitor copies `dist/web/` into tracked projects under `platforms/ios/` and `platforms/android/`. Native toolchains keep their working directories there; collect signed release artifacts into `dist/ios/` and `dist/android/`.

Vite may clear its own `dist/web/` on rebuild; never clear all of `dist/`, which also contains other platforms and Steam staging. Release collection and staging must preserve existing outputs unless an explicit destructive option such as `--clean` is passed. Build into a temporary sibling directory first when replacing release staging, validate source and target paths, and only swap directories after a complete successful copy.

## References in This Workspace

- Engine distribution/runtime: `jrpg-stellar-engine/README.md`, `jrpg-stellar-engine/package.json`, `jrpg-stellar-engine/jrpg-stellar-engine.js.ejs`.
- When studying any existing game, distinguish reusable gameplay boundaries from project-specific globals, development bootstraps, and deployment assumptions.
