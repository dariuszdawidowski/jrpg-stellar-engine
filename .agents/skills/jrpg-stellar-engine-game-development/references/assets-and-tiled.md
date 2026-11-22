# Assets and Tiled

Keep game content as files that can be edited, versioned, loaded, and validated independently of application code.

## Asset Layout and URLs

Follow the [default directory layout](./project-architecture.md#default-directory-layout). Configure Vite `publicDir: 'assets'` so runtime files are served from the application root and copied unchanged into `dist/web/`. Keep editable artwork/audio projects under `assets-src/`, outside the bundle. For example:

```text
assets/
  levels/town.tmx
  sprites/town/town.tsx
  sprites/town/town.png
  sprites/characters/player.acx
  sprites/characters/player.png
```

Resolve the map URL with `new URL(import.meta.env.BASE_URL + 'levels/town.tmx', document.baseURI).href`. With base `'./'`, this loads relative to the current application entrypoint. The TMX tileset source is `../sprites/town/town.tsx`; its TSX image source is `town.png`. An actor reference from the TMX is `../sprites/characters/player.acx`. Verify all references under Vite development, production hosting and the packaged native/desktop runtime. Keep maps and actor definitions out of inline HTML/JavaScript.

Vite-imported assets can also work, but importing a TMX file as a URL does not automatically rewrite its nested TSX/image references. Preserve a coherent relative file layout or explicitly manage those URLs, and test the built output.

## Engine Loading Path

- Prefer `LoaderTMX.loadLevel({ url, scale, view })` for separately stored maps. Its current default `prefetch: true` discovers referenced TSX and ACX assets and loads TSX images.
- The TMX loader resolves a TSX source relative to the TMX URL. The TSX loader resolves its image source relative to the TSX URL when given that URL.
- `LoaderTMX.parseLevel()` is for XML already in memory. With `prefetch: false`, do not expect external TSX/ACX files to be fetched automatically; inspect the current source and supply the resources it needs.
- `Cache.getImage(src)` asynchronously loads and caches images by URL. Await it before rendering. Errors reject; the current engine loader code does not check `response.ok` for every fetch, so inspect network status as well as promise failures.
- Loading an image layer or object-group actor may outlive the `loadLevel()` promise in the current implementation. Consult [engine readiness caveats](./engine-api.md#readiness-caveats-in-the-current-source) and explicitly gate gameplay on resources the scene requires.

## Tiled Authoring

- Keep `.tmx`, `.tsx`, image files, and `.acx` definitions as separate authored files. Commit the exported files and their dependencies together.
- Use object layers and documented object types/properties for spawn points, portals, and other engine-supported map objects. Confirm property names and parsing rules in `src/loader-tmx.js` before relying on them.
- Use unique, stable names/IDs for content that code needs to find. Put tuning values in Tiled properties or separate data files when that keeps game logic independent from a specific map.
- Check tileset `firstgid`, tile dimensions, image dimensions, animation frames, and relative paths after moving or renaming files.
- Test one small representative map before converting a large level set.

## Do Not Copy from Inline Demos

`jrpg-stellar-engine/example/index.html` embeds XML and declares image elements in the document to keep the demo self-contained. Treat this as an API demonstration, not the target content or loading architecture for a Vite game. Keep authored map, tileset, actor, and image files separate in production projects.
