# Engine API Notes

The installed engine source is authoritative. These notes describe the current repository API and should be rechecked when the consumer uses another engine version.

## Rendering and Frame Loop

- `new View({ canvas, bounds, debug })` creates a Canvas view and installs a resize handler. The canvas must exist in the DOM before construction.
- A typical frame clears with `view.cls()`, updates simulation with a delta time in seconds, calls `level.update(deltaTime)`, and renders with `level.render(view)`.
- Keep the engine's coordinate/scale conventions consistent. Do not multiply movement or tile dimensions by the visual scale twice.
- Bound unusually large frame deltas after a stalled tab. The engine example clamps delta to `0.1` seconds; choose and document a policy appropriate to the game.
- Optional chunk baking is `level.bakeChunks()` after tilesets and tile layers are ready. It is opt-in, and baked tile layers must not be mutated without the appropriate invalidation path.

## Loading a Tiled Level

`new LoaderTMX()` can load external content with `await loader.loadLevel({ url, scale, view })`. The current implementation fetches the TMX, resolves external TSX paths relative to the TMX URL, prefetches TSX and ACX resources by default, and asks the TSX loader to preload tileset images. `LoaderTMX.parseLevel({ xml, url, scale, view })` parses supplied XML; when resource prefetch is disabled, callers must provide the resources expected by the map or the matching DOM-backed data expected by this implementation.

After loading, use supported `Level` methods and data such as spawn points, layers, actors, portals, `update()`, and `render()` only after confirming their behavior in the installed version. Object-group spawn points can create actors from ACX definitions, and maps can also supply portals and other supported object types.

## Actors

- `LoaderACX.parseActor({ xml, scale, ... })` asynchronously parses an ACX actor definition and creates an engine actor.
- `Actor` extends the animated sprite behavior and provides movement/collision helpers, animation state, and optional mounts. Check exact methods/arguments before calling them; a method shown on a subclass in a sample may not be part of the base API.
- A game may subclass `Actor` for domain behavior, but keep its dependencies explicit. Avoid copying sample classes that reach through a global `main` singleton.

## Readiness Caveats in the Current Source

Do not interpret the `loadLevel()` promise as a universal guarantee that every visual and spawned actor is ready:

- `LoaderTMX.parseObjectGroup()` iterates objects synchronously and calls async spawn parsing without awaiting each promise. A map can therefore finish parsing while spawned actors are still being created.
- `parseImageLayer()` assigns a new `Image` to an image layer but does not await its `load` or `error` event.
- The fetch paths read response text/blob without consistently checking `response.ok`; HTTP error statuses may not reject automatically.

For any level relying on spawned actors or image layers, test readiness in the consumer and the exact engine version. If correctness requires a guarantee the loader does not provide, coordinate/track the required asset or spawn promises in an application-level loading phase, or propose a focused engine fix when the task includes engine maintenance. Do not silently start a scene that depends on unresolved resources.

## API Sources

- `src/view.js`
- `src/level.js`
- `src/actor.js`
- `src/loader-acx.js`
- `src/loader-tmx.js`
- `src/loader-tsx.js`
- `README.md`