<h1 align="center">
JRPG Stellar Engine
</h1>
<p align="center">
Retro JRPG browser game engine.
</p>
<p align="center">
v0.8.3 (2026)
</p>

[![build](https://github.com/dariuszdawidowski/jrpg-stellar-engine/actions/workflows/build.yml/badge.svg)](https://github.com/dariuszdawidowski/jrpg-stellar-engine/actions/workflows/build.yml)
[![npm](https://img.shields.io/npm/v/jrpg-stellar-engine)](https://www.npmjs.com/package/jrpg-stellar-engine)
[![NPM Downloads](https://img.shields.io/npm/dm/jrpg-stellar-engine)](https://www.npmjs.com/package/jrpg-stellar-engine)
[![license](https://img.shields.io/github/license/dariuszdawidowski/jrpg-stellar-engine?color=9cf)](./LICENSE)

# About
JRPG Stellar Engine is a powerful and flexible framework designed to help developers create captivating oldschool japanese role-playing style games for web browsers in JavaScript.
Whether you are an indie developer working on your first game or an experienced programmer looking to streamline your development process, our engine provides the tools and features you need to bring your ideas to life.

# Demo
Open `example/index.html` in the browser.

# Quick start
Include `dist/jrpg-stellar-engine.js` in your html file.

## Vanilla JS (browser script tag)
```html
<script src="dist/jrpg-stellar-engine.js"></script>
<script>
    const level = new Level({ /* ... */ });
</script>
```
Classes and functions (`Actor`, `Level`, `Cache`, `Pathfinder`, `randomRangeInt`, etc.) are exposed as global variables, same as the individual `src/*.js` files.

## Node.js (CommonJS require)
```js
const { Actor, Level, Cache, Pathfinder } = require('jrpg-stellar-engine');
```

# Pathfinding
`Pathfinder` finds a path using the level's collider list. Pass `level.getColliderGrid()` instead of `level.getColliders()` to use spatial queries. `findPath()` may return `null` while an incremental search is still in progress; call it again with the same start, end, and collider source to continue. After mutating colliders in place, call `level.invalidateColliderGrid()` when using a grid, then call `pathfinder.invalidateSearch()` before searching again.

```js
const pathfinder = new Pathfinder({ gridSize: 16, maxSearchDistance: 1000 });
const path = pathfinder.findPath(start, end, level.getColliderGrid());
```

# Levels
Compatible with "Tiled" map editor format (tsx+tmx) https://www.mapeditor.org/.

`LoaderTMX.loadLevel()` and `LoaderTMX.parseLevel()` accept an optional `cullingMargin` in rendered pixels. It expands actor visibility checks on each edge of the viewport; the default is `0`.

## Level layers

Layers can be ordered in three ways, from the simplest to the most flexible. Layer names are lowercase.

### 1. Natural order

`level.render(view)` renders every layer in natural Tiled order (bottom to top). Pass a layer-name array, e.g. `level.render(view, ['floor', 'objects'])`, to render only the selected layers.

### 2. Forced order (`zband`)

Add a numeric custom property `zband` to a layer in Tiled to override its position in the render order. Layers are rendered in ascending `zband`; layers with equal values keep their natural order.

* A layer without `zband` uses its natural index (0, 1, 2, ...), so maps without any `zband` are unaffected.
* When mixing, pick values from the same scale, e.g. to draw `cover` before the first `objects` layer give it a `zband` lower than that layer's natural index.
* `zband` applies to every layer type (tiles, objects, image, colliders) and reorders whole layers only; it does not sort actors across layers.
* It also defines the order of layers inside each group of a render pass (see below).

Example:

| Layer | Natural index | `zband` | Rendered |
|-------|---------------|---------|----------|
| `floor` | 0 | - | 1st |
| `objects` | 1 | - | 3rd |
| `cover` | 2 | `0.5` | 2nd |

#### Actor sorting and ZGate

Actors inside an objects layer with the custom property `sort` set to `true` are sorted by their baseline Y. To draw an actor above a specific tile layer (e.g. in front of a shelf), place a `ZGate` object in Tiled: a rectangle with the properties `layer` (tile layer name, e.g. `cover`), `scope` (`actor` by default, or `mount:<slot>` to flip only a mounted child) and optional `anchor` (offset of the seam line from the gate's top in map pixels; default is its bottom edge). An actor whose mask overlaps the gate and whose baseline is below the seam is drawn right after that layer.

### 3. Render passes

For full control use an ordered pipeline that interleaves layer groups with custom rendering callbacks:

```js
level.render(view, {
    passes: [
        { layers: ['ground'] },
        { render: (view, level) => renderReflections(view, level), lit: true },
        { layers: ['actors'] },
        { render: (view, level) => renderSpellEffects(view, level) },
        { layers: ['canopy'] },
        { render: (view, level) => renderForegroundEffects(view, level) }
    ]
});
```

Layers in each group retain their `zband` order, while pipeline entries render in the order listed. A layer may appear in multiple groups. Actor culling, sorting, and ZGate preparation run once per `render()` call. Custom callbacks run outside the lighting batch by default; set `lit: true` to render a callback inside the current batch and avoid an extra full-canvas lighting pass. Lit custom content receives the level's dynamic lighting.

## Colliders

For levels with many colliders, `level.getColliderGrid()` provides an opt-in spatial index. Use `actor.collideGrid(level.getColliderGrid(), deltaTime)` in place of `actor.collide(level.getColliders(), deltaTime)`. The default grid cell size is 64 pixels and can be set with `colliderGridCellSize` when creating a `Level`. Call `level.invalidateColliderGrid()` after mutating the collider list in place.

# Load from CDN
https://unpkg.com/jrpg-stellar-engine@latest/dist/jrpg-stellar-engine.js

# Release (for developers)
* Bump version in the package.json + `npm i`
* Bump version in the README.md
* Bump version in the jrpg-stellar-engine.js.ejs and build number `git rev-list --count HEAD`

# License
The library is distributed under the MIT License (see LICENSE file for details).

Graphics in demo comes from Super Retro Collection by Gif https://twitter.com/gif_not_jif for licensing details please refer https://gif-superretroworld.itch.io page.