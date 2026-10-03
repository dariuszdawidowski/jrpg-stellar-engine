/**
 * Level map with all tiles, items and actors
 */

class Level {

    /**
     * Constructor
        * @param args.view: Object - view reference
        * @param args.cullingMargin: Number - extra actor culling margin in pixels (default 0)
     */

    constructor(args) {

        // Center of the coordinate system correction (this is constant not scroll)
        this.offset = {x: 0, y: 0};

        // The furthest tiles in world coordinates (counted automatically)
        this.bounds = {left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity};

        // Scale
        this.scale = 1;

        // Tileset definitions Map<tileset id, {ref: TileSet object reference, first: Number of index offset}>
        this.tilesets = new Map();

        // Tile size
        this.tile = { w: 0, h: 0 };

        // Environment layers [{type: 'tiles|image|objects', name: 'string', class: 'string', map: [[]]}, ...]
        this.layers = [];

        // Custom renderers
        this.renderers = {};

        // Actors {type: {'name': object, ...}, ...} for items, chars, npcs, mobs, mounts, vehicles, etc.
        this.actors = {};

        // Current actors {'layer': [actor, ...], ...} (each layer separately culled and sorted) for rendering
        this.renderActors = {};

        // Spawn points {'player-1': [ SpawnPoint, ...], ...}
        this.spawnpoints = {};

        // Respawn points [RespawnPoint, ...]
        this.respawnpoints = [];

        // Stairs [{x1, y1, x2, y2, x3, y3, x4, y4}, ...] from left-top clockwise in world coordinates
        this.stairs = [];

        // Portals to other maps [{map, spawn, left, top, right, bottom}, ...]
        this.portals = [];

        // Generic masks [{name, left, top, right, bottom}, ...]
        this.masks = [];

        // Z-order gates [{name, layer, anchorY, scope, left, top, right, bottom}, ...] - let an actor/mount jump above one specific cover layer
        this.zgates = [];

        // Actors deferred past their home 'objects' layer into a later cover layer's overlay pass, keyed by cover layer name, rebuilt every frame
        this.deferredActors = {};

        // Generic shapes [{name, x, y, points: [{x, y}, ...], properties: {}}, ...]
        this.shapes = [];

        // Texts [{name, x, y, align, text}, ...]
        this.texts = [];

        // Map global properties
        this.properties = {};

        // Lighting
        this.lights = {
            // Ambient light color {r: 0, g: 0, b: 0, static: bool} (from -255 to 255, 0 is neutral, null or static=false for no ambient dynamic light calculations)
            ambient: null,
            // Point lights [{x, y, radius, color: {r, g, b}, intensity}, ...], brightening only
            points: [],
            // Spot lights [{x, y, radius, angle, cone, color: {r, g, b}, intensity}, ...], brightening only
            spots: [],
            // 'scene' tints tiles/colliders/objects every frame (default), 'sprites' skips tiles/colliders (cheaper, relies on baked static ambient there)
            mode: 'scene',
        };

        // Ambient light compositor for tiles/colliders/objects layers
        this.lightRender = new Lighting();

        // Id generation counter
        this.idGen = 0;

        // Loaders
        this.loader = {
            acx: new LoaderACX()
        };

        // View reference
        this.view = args.view;

        // Extra actor culling margin in rendered pixels
        this.cullingMargin = Math.max(0, args.cullingMargin ?? 0);

        // Colliders for the whole level (calculated automatically)
        this.colliders = null;
        this.colliderGrid = null;
        this.colliderGridCellSize = args.colliderGridCellSize ?? 64;

        // Chunk pre-rendering (optional perf feature, opt-in via bakeChunks()): tile-grid chunk size in tiles
        this.chunkSize = args.chunkSize || 16;

        // True once bakeChunks() has finished (render() only takes the chunk-blit path afterwards)
        this.chunksEnabled = false;

        // Baked chunk canvases Map<'layerName:cx:cy', {canvas: HTMLCanvasElement|null, dynamic: bool}>
        this.chunks = new Map();
    }

    /**
     * Permanently bake a signed per-channel tint into the atlas images currently in use (tilesets
     * and currently-spawned actors), with zero ongoing per-frame cost - unlike light.ambient/points/spots
     * this doesn't affect actors spawned afterwards using the same shared image resource
     * @param args.r/g/b: Number - signed offset per channel (-255..255, 0 neutral), same as light.ambient
     */

    async precalculateAmbient(color = null) {

        const { r, g, b } = color || this.lights.ambient || { r: 0, g: 0, b: 0 };

        // Collect every atlas currently referenced by this level's tilesets and actors
        const atlases = [
            ...Array.from(this.tilesets.values()).map(tileset => tileset.ref.atlas),
            ...Object.values(this.actors).flatMap(group => Object.values(group).map(actor => actor.atlas))
        ];

        // Tint each unique underlying image once, even if several atlases share it
        const tinted = new Map();
        for (const atlas of atlases) {
            if (!tinted.has(atlas.image)) {
                const source = atlas.image;
                const canvas = document.createElement('canvas');
                canvas.width = source.naturalWidth || source.width;
                canvas.height = source.naturalHeight || source.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(source, 0, 0);

                let image;
                try {
                    image = ctx.getImageData(0, 0, canvas.width, canvas.height);
                } catch (error) {
                    // Canvas tainted by cross-origin/file:// images - pixel readback is impossible, skip baking
                    console.warn('precalculateAmbient skipped: canvas is tainted (serve the page over http(s), not file://)', error);
                    return;
                }
                const data = image.data;
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] === 0) continue; // skip fully transparent pixels
                    data[i] += r; // Uint8ClampedArray clamps to 0-255 automatically
                    data[i + 1] += g;
                    data[i + 2] += b;
                }
                ctx.putImageData(image, 0, 0);

                // Bake into a plain <img> instead of leaving the raw canvas as the draw source - reading
                // pixels back from a canvas disables its GPU texture caching, tanking FPS once it's
                // drawn many times per frame (once per tile)
                const baked = new Image();
                await new Promise(resolve => {
                    baked.onload = resolve;
                    baked.src = canvas.toDataURL();
                });

                tinted.set(source, baked);
            }
            atlas.image = tinted.get(atlas.image);
        }

    }

    /**
     * Pre-render every 'tiles' layer into fixed-size chunk canvases (see this.chunkSize), with any
     * static ambient light baked in once - render() then blits whole chunks instead of iterating every
     * tile every frame, and skips chunks fully outside the viewport. Opt-in: call once after tilesets
     * are loaded (layers/tilesets must not change afterwards, besides single tiles via invalidateChunk).
     * Chunks containing an animated tile are left out of the bake and keep rendering live (see bakeChunk).
     */

    bakeChunks() {
        this.chunks.clear();
        for (const layer of this.layers) {
            if (layer.type !== 'tiles') continue;
            const cols = layer.map[0]?.length || 0;
            const rows = layer.map.length;
            const chunkCols = Math.ceil(cols / this.chunkSize);
            const chunkRows = Math.ceil(rows / this.chunkSize);
            for (let cy = 0; cy < chunkRows; cy++) {
                for (let cx = 0; cx < chunkCols; cx++) {
                    this.bakeChunk(layer, cx, cy);
                }
            }
        }
        this.chunksEnabled = true;
    }

    /**
     * (Re)bake a single chunk of a layer, e.g. after a runtime tile change (destructible tile, door, ...)
     * @param layerName: string
     * @param tileX/tileY: Number - any tile coordinate inside the chunk to rebake
     */

    invalidateChunk(layerName, tileX, tileY) {
        if (!this.chunksEnabled) return;
        const layer = this.layers.find(l => l.type === 'tiles' && l.name === layerName);
        if (!layer) return;
        this.bakeChunk(layer, Math.floor(tileX / this.chunkSize), Math.floor(tileY / this.chunkSize));
    }

    /**
     * Bake (or re-bake) one chunk canvas of a layer, used by bakeChunks() and invalidateChunk()
     */

    bakeChunk(layer, cx, cy) {
        const tileset = this.tilesets.values().next().value || null;
        if (!tileset) return;

        const slice = layer.map
            .slice(cy * this.chunkSize, cy * this.chunkSize + this.chunkSize)
            .map(row => row.slice(cx * this.chunkSize, cx * this.chunkSize + this.chunkSize));
        if (slice.length === 0 || slice[0].length === 0) return;

        const key = `${layer.name}:${cx}:${cy}`;

        // Animated tiles can't be baked into a static bitmap - leave the whole chunk to be rendered live
        const dynamic = slice.some(row => row.some(nr => {
            for (const ts of this.tilesets.values()) {
                const index = nr - ts.first;
                if (index > -1 && index in ts.ref.anim) return true;
            }
            return false;
        }));
        if (dynamic) {
            this.chunks.set(key, { canvas: null, dynamic: true });
            return;
        }

        const w = slice[0].length * tileset.ref.tile.scaled.width;
        const h = slice.length * tileset.ref.tile.scaled.height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;

        // Minimal view shim: chunk-local coordinates, no camera scroll
        const chunkPoint = { x: 0, y: 0 };
        const chunkView = {
            ctx,
            canvas: { width: w, height: h },
            world2Screen: transform => transform,
            world2ScreenXY: (x, y) => {
                chunkPoint.x = x;
                chunkPoint.y = y;
                return chunkPoint;
            }
        };
        for (const ts of this.tilesets.values()) {
            ts.ref.render(chunkView, slice, 0, 0, ts.first);
        }

        // Bake static ambient once - dynamic point/spot lights always stay computed per frame
        if (this.lights.ambient?.static) {
            const { r, g, b } = this.lights.ambient;
            const image = ctx.getImageData(0, 0, w, h);
            const data = image.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) continue; // skip fully transparent pixels
                data[i] += r; // Uint8ClampedArray clamps to 0-255 automatically
                data[i + 1] += g;
                data[i + 2] += b;
            }
            ctx.putImageData(image, 0, 0);
        }

        this.chunks.set(key, { canvas, dynamic: false });
    }

    /**
     * Generate unique id
     */

    genId() {
        return ++this.idGen;
    }

    /**
     * Returns list of all colliders
     */

    getColliders(margin = 0) {
        if (this.colliders === null) {
            this.colliders = [];
            const tilesets = Array.from(this.tilesets.values()).sort((a, b) => a.first - b.first);
            this.layers.forEach(layer => {
                if (layer.class !== 'colliders') return;

                tilesets.forEach((tileset, index) => {
                    const nextFirst = tilesets[index + 1]?.first ?? Infinity;
                    const tiles = layer.map.map(row => row.map(gid => (
                        gid > 0 && gid >= tileset.first && gid < nextFirst ? gid : 0
                    )));
                    this.colliders.push(...tileset.ref.getColliders(tiles, this.offset.x, this.offset.y, tileset.first, margin));
                });
            });
        }
        return this.colliders;
    }

    getColliderGrid(cellSize = this.colliderGridCellSize) {
        const colliders = this.getColliders();
        if (!this.colliderGrid || this.colliderGrid.colliders !== colliders || this.colliderGrid.cellSize !== cellSize) {
            this.colliderGrid = new SpatialGrid(colliders, cellSize);
            this.colliderGridCellSize = cellSize;
        }
        return this.colliderGrid;
    }

    invalidateColliderGrid() {
        this.colliderGrid = null;
    }

    /**
     * Returns list of all stairs/slopes
     */

    getStairs() {
        return this.stairs;
    }

    /**
     * Returns a random spawn point of type
     */

    getSpawnPoint(type, fallback = null) {
        if (type in this.spawnpoints && this.spawnpoints[type].length > 0) {
            const spawnpoint = this.spawnpoints[type][randomRangeInt(0, this.spawnpoints[type].length - 1)];
            if (spawnpoint) return spawnpoint;
        }
        return fallback;
    }

    /**
     * Returns all spawn point for given type
     */

    getSpawnPoints(type, fallback = []) {
        // Wildcard search
        if (type.includes('*')) {
            const regex = new RegExp('^' + type.replace('*', '.*') + '$');
            const matchingTypes = Object.keys(this.spawnpoints).filter(spType => regex.test(spType));
            const matchingSpawnPoints = matchingTypes.flatMap(spType => this.spawnpoints[spType]);
            if (matchingSpawnPoints.length > 0) return matchingSpawnPoints;
        }

        // Normal search
        else if (type in this.spawnpoints && this.spawnpoints[type].length > 0) {
            return this.spawnpoints[type];
        }

        // Fallback
        return fallback;
    }

    /**
     * Check respawn points and spawn if necessary
     */

    async respawn() {
        // Iterate through all respawn types
        for (const point of this.respawnpoints) {
            const spawnArgs = point.respawnCheck();
            if (spawnArgs) await this.spawn({ ...spawnArgs, point });
        }
    }

    /**
     * Spawn an actor directly
     * @param args.id: string - (optional) custom id
     * @param args.type: string - actor group 'mob', 'vehicle' etc.
     * @param args.actor.xml: string - acx as an xml string [optional] | @param args.actor.data: string - use actor.serialize() data [optional]
     * @param args.actor.scale: Number - sprite scale
     * @param args.actor.properties: Object - actor properties
     * @param args.layer: string - layer name of the level in which to spawn
     * @param args.x: Number - x coordinate to spawn
     * @param args.y: Number - y coordinate to spawn
     * @param args.w: Number - width of the random spawn area
     * @param args.h: Number - height of the random spawn area
     * @param args.point: RespawnPoint - (optional) point reference to know where to respawn again
     * @returns {Promise<ActorInstance>} Promise resolving to the spawned actor
     */

    async spawn(args) {
        // Position in the area range
        const transform = {
            x: args.x + (args.w / 2) + Math.floor(Math.random() * (args.w + 1) - (args.w / 2)),
            y: args.y + (args.h / 2) + Math.floor(Math.random() * (args.h + 1) - (args.h / 2))
        };

        // Create instance (use await!)
        let actorInstance;
        if ('xml' in args.actor) {
            actorInstance = await this.loader.acx.parseActor({ ...args.actor, type: args.type, transform });
        } else {
            // Sprawdź czy createActor też jest async
            actorInstance = await this.loader.acx.createActor({ ...args.actor.data, type: args.type, transform });
        }
        
        if ('point' in args) actorInstance.spawn = args.point;
        if (!actorInstance) {
            console.error('Error spawning ACX', args);
            return null;
        }

        // Assign references
        actorInstance.level = this;
        actorInstance.view = this.view;

        // Actor's id
        if ('id' in args) actorInstance.id = args.id;
        if (!actorInstance.id) actorInstance.id = `${args.layer}.${actorInstance.name}.${this.genId()}`;

        // Add to layer registry
        const objectLayer = this.layers.find(layer => layer.name === args.layer);
        if (objectLayer && objectLayer.type === 'objects') {
            if (!objectLayer.actors) objectLayer.actors = [];
            if (!objectLayer.actors.includes(actorInstance.id)) objectLayer.actors.push(actorInstance);
        }

        // Add a type to global actors registry
        if (!(args.type in this.actors)) this.actors[args.type] = {};

        // Add an actor
        this.actors[args.type][actorInstance.id] = actorInstance;

        // Returns new actor instance
        return actorInstance;
    }

    /**
     * Despawn an actor
     * @param id: string - actor's unique id
     */

    despawn(id) {
        // Remove from layer
        for (const layer of this.layers) {
            if (('actors' in layer) && Array.isArray(layer.actors)) {
                const index = layer.actors.findIndex(actor => actor.id === id);
                if (index !== -1) {
                    layer.actors.splice(index, 1);
                    break;
                }
            }
        }
        // Remove from actor types
        for (const type in this.actors) {
            if (id in this.actors[type]) {
                if ('spawn' in this.actors[type][id]) this.actors[type][id].spawn.decrease();
                delete this.actors[type][id];
                break;
            }
        }
    }

    /**
     * Returns list of all objects with class 'portal'
     */

    getPortals() {
        return this.portals;
    }

    /**
     * Returns list of all objects with class 'mask'
     */

    getMasks() {
        return this.masks;
    }

    /**
     * Find layer
     */

    getLayer(name) {
        for (const layer of this.layers) {
            if (layer.name == name) return layer;
        }
        return null;
    }

    /**
     * Returns list of all layers
     */

    getLayers() {
        return this.layers;
    }

    /**
     * Resolve a layer's render-order band: explicit 'zband' property wins, otherwise its position in
     * this.layers (i.e. today's plain Tiled layer order), so maps without any zband stay unaffected
     */

    resolveZBand(layer) {
        return ('zband' in layer.properties) ? layer.properties.zband : this.layers.indexOf(layer);
    }

    /**
     * Register custom layers with actor loaders and renderers
     */

    addCustomRenderLayer(name, actors) {
        this.renderers[name] = actors;
    }

    /**
     * Update all actors
     */

    update(deltaTime) {

        // Update tilesets
        for (const tileset of this.tilesets.values()) {
            tileset.ref.update(deltaTime);
        }

        // Gather level colliders
        const colliders = this.getColliders();

        // Update all actors
        for (const group in this.actors) {
            for (const name in this.actors[group]) {
                this.actors[group][name].update({ deltaTime, colliders });
            }
        }

    }

    /**
     * Render layers (from list or just all of them)
     */

    render(view, layers = null) {

        const ambient = this.lights.ambient;
        const hasPoints = this.lights.points.length > 0;
        const hasSpots = this.lights.spots.length > 0;
        const spritesOnly = this.lights.mode === 'sprites';
        let lighting = false;

        // Ends the current batch of tinted layers, if any
        const flushLighting = () => {
            if (lighting) {
                this.lightRender.end(view, this.lights);
                lighting = false;
            }
        };

        // Clear last frame's ZGate overrides before recomputing them below
        this.deferredActors = {};
        // Skip entirely when there are no ZGates, and reuse each actor's object instead of reallocating it every frame
        if (this.zgates.length > 0) {
            Object.values(this.actors).forEach(group => Object.values(group).forEach(actor => {
                for (const slot in actor.mountOverrides) delete actor.mountOverrides[slot];
            }));
        }

        // Prepare render actors (culled, sorted and ZGate-deferred)
        this.layers.forEach(layer => {
            if (layer.type === 'objects') this.prepareRenderActors(view, layer);
        });

        // Render in zband order (defaults to plain Tiled layer order) instead of raw this.layers
        const orderedLayers = [...this.layers].sort((a, b) => this.resolveZBand(a) - this.resolveZBand(b));

        // Iterate layers
        orderedLayers.forEach(layer => {
            if (layers && !layers.includes(layer.name)) return;

            // Group consecutive tiles/colliders/objects layers into a single tint pass - in 'sprites'
            // lights.mode tiles/colliders are skipped (cheaper, relies on their baked static ambient)
            const tintable = (ambient || hasPoints || hasSpots) && (layer.type == 'objects' || (!spritesOnly && (layer.type == 'tiles' || layer.type == 'colliders')));
            if (tintable && !lighting) {
                this.lightRender.begin(view);
                lighting = true;
            } else if (!tintable) flushLighting();

            // Render backgrounds/foregrounds
            if (layer.type === 'image') this.renderImageLayer(view, layer);

            // Render actors
            else if (layer.type === 'objects') this.renderObjectsLayer(view, layer);

            // Render tiles
            else if (layer.type === 'tiles') {
                // Render shadows
                if (layer.class === 'shadows') this.renderShadowsLayer(view, layer);
                // Render reflections
                else if (layer.class === 'reflect') this.renderReflectLayer(view, layer);
                // Generic tiles layer
                else this.renderTilesLayer(view, layer);
                // Actors/mounts that jumped above this specific cover layer via a ZGate
                this.renderDeferredActors(view, layer);
            }

            // Render custom
            else this.renderCustomLayer(view, layer);

        });

        flushLighting();

    }

    /**
     * Render image layer
     */

    renderImageLayer(view, layer) {
        view.background(
            layer.src,
            {x: layer.x * this.scale, y: layer.y * this.scale},
            {w: layer.w * this.scale, h: layer.h * this.scale},
            layer.repeat,
            layer.parallax,
            layer.coordinates
        );
    }

    /**
     * Prepare actors for rendering (culling, sorting and ZGate overrides)
     */

    prepareRenderActors(view, layer) {

        // Create layer if not exists or clear it if exists
        if (!(layer.name in this.renderActors)) this.renderActors[layer.name] = [];
        else this.renderActors[layer.name].length = 0;

        // Cull off-screen actors
        for (const actor of layer.actors) {
            if (this.isActorVisible(view, actor)) this.renderActors[layer.name].push(actor);
        }

        // Sort actors
        if (layer.properties.sort) this.renderActors[layer.name].sort(function(a, b) {
            return (a.transform.y - a.origin.y + a.tile.scaled.halfHeight) - (b.transform.y - b.origin.y + b.tile.scaled.halfHeight);
        });

        // Apply ZGate overrides, deferring whole actors past their home layer or flagging a mount slot to flip in front
        if (this.zgates.length > 0) this.applyZGates(this.renderActors[layer.name]);

    }

    /**
     * Check every actor against every ZGate, moving matches into this.deferredActors (scope 'actor') or
     * flagging a mount slot override (scope 'mount:<slot>') - only actors past a gate's anchorY are affected
     */

    applyZGates(actors) {
        // Single forward pass, compacting kept actors in place instead of splice() (O(n) instead of O(n^2))
        let writeIndex = 0;
        for (let i = 0; i < actors.length; i++) {
            const actor = actors[i];
            const baselineY = actor.transform.y - actor.origin.y + actor.tile.scaled.halfHeight;
            const mask = actor.getMask();
            let deferredTo = null;

            for (const gate of this.zgates) {
                if (baselineY < gate.anchorY || !box4Box(mask, gate)) continue;

                if (gate.scope.startsWith('mount:')) {
                    actor.mountOverrides[gate.scope.slice('mount:'.length)] = true;
                }
                else if (!deferredTo) {
                    deferredTo = gate.layer;
                }
            }

            // Move the whole actor out of its home layer into the target cover layer's overlay pass
            if (deferredTo) {
                if (!(deferredTo in this.deferredActors)) this.deferredActors[deferredTo] = [];
                this.deferredActors[deferredTo].push(actor);
            }
            else {
                actors[writeIndex++] = actor;
            }
        }
        actors.length = writeIndex;
    }

    isActorVisible(view, actor) {
        const width = actor.tile.scaled.width;
        const height = actor.tile.scaled.height;
        const margin = this.cullingMargin;

        const pos = view.world2ScreenXY(actor.transform.x - actor.origin.x - margin, actor.transform.y - actor.origin.y - margin);

        return (
            pos.x + width + margin * 2 >= 0 &&
            pos.x <= view.canvas.width &&
            pos.y + height + margin * 2 >= 0 &&
            pos.y <= view.canvas.height
        );
    }    

    /**
     * Render objects layer
     */

    renderObjectsLayer(view, layer) {

        // Render actors
        this.renderActors[layer.name].forEach(actor => {
            actor.render(view, false, this.cullingMargin);
        });

    }

    /**
     * Render actors/mounts deferred onto this specific cover layer by a ZGate (see applyZGates)
     */

    renderDeferredActors(view, layer) {
        if (!(layer.name in this.deferredActors)) return;
        this.deferredActors[layer.name].forEach(actor => actor.render(view, false, this.cullingMargin));
    }

    /**
     * Render tiles layer
     */

    renderTilesLayer(view, layer) {
        if (this.chunksEnabled) this.renderTilesLayerChunked(view, layer);
        else for (const tileset of this.tilesets.values()) {
            tileset.ref.render(view, layer.map, this.offset.x - layer.offset.x, this.offset.y - layer.offset.y, tileset.first);
        }
    }

    /**
     * Render tiles layer by blitting pre-baked chunks (see bakeChunks()), skipping off-screen ones;
     * chunks with animated tiles (not baked) fall back to a live per-tile render of just that chunk
     */

    renderTilesLayerChunked(view, layer) {
        const tileset = this.tilesets.values().next().value || null;
        if (!tileset) return;

        const sx = this.offset.x - layer.offset.x;
        const sy = this.offset.y - layer.offset.y;
        const factor = tileset.ref.tile.scaled.factor;
        const tileW = tileset.ref.tile.scaled.width;
        const tileH = tileset.ref.tile.scaled.height;
        const chunkPixelW = this.chunkSize * tileW;
        const chunkPixelH = this.chunkSize * tileH;
        const cols = layer.map[0]?.length || 0;
        const rows = layer.map.length;
        const chunkCols = Math.ceil(cols / this.chunkSize);
        const chunkRows = Math.ceil(rows / this.chunkSize);

        for (let cy = 0; cy < chunkRows; cy++) {
            for (let cx = 0; cx < chunkCols; cx++) {

                // Top-left of this chunk in screen space, matching the per-tile math in TileSet.render()
                const worldX = (-sx * factor) + (cx * this.chunkSize * tileW);
                const worldY = (-sy * factor) + (cy * this.chunkSize * tileH);
                const screen = view.world2ScreenXY(worldX, worldY);

                // Skip chunks fully outside the viewport
                if (screen.x + chunkPixelW < 0 || screen.x > view.canvas.width ||
                    screen.y + chunkPixelH < 0 || screen.y > view.canvas.height) continue;

                const chunk = this.chunks.get(`${layer.name}:${cx}:${cy}`);

                if (chunk && !chunk.dynamic) {
                    view.ctx.drawImage(chunk.canvas, Math.round(screen.x), Math.round(screen.y));
                }
                else {
                    // Not baked (animated tiles) - render just this chunk's tiles live
                    const localSx = sx - (cx * this.chunkSize) * tileset.ref.tile.width;
                    const localSy = sy - (cy * this.chunkSize) * tileset.ref.tile.height;
                    const slice = layer.map
                        .slice(cy * this.chunkSize, cy * this.chunkSize + this.chunkSize)
                        .map(row => row.slice(cx * this.chunkSize, cx * this.chunkSize + this.chunkSize));
                    for (const ts of this.tilesets.values()) {
                        ts.ref.render(view, slice, localSx, localSy, ts.first);
                    }
                }
            }
        }
    }

    /**
     * Render shadows layer
     */

    renderShadowsLayer(view, layer) {

        // Render tiles
        this.renderTilesLayer(view, layer);

        // Render actor's shadows
        for (const layerName in this.renderActors) {
            this.renderActors[layerName].forEach(actor => {
                if (actor.shadow) actor.renderShadow(view);
            });
        }

    }

    /**
     * Render reflect layer
     */

    renderReflectLayer(view, layer) {

        // Render tiles
        this.renderTilesLayer(view, layer);

        // Render actor's reflections
        for (const layerName in this.renderActors) {
            this.renderActors[layerName].forEach(actor => {
                if (actor.reflect) actor.renderReflect(view);
            });
        }

    }

    /**
     * Render custom layer
     */

    renderCustomLayer(view, layer) {
        if (layer.class in this.renderers) {
            layer.actors.forEach(actor => {
                if (actor.type in this.renderers[layer.class]) this.renderers[layer.class][actor.type](actor);
            });
        }
    }

    /**
     * Render debug info
     */

    debug(view) {

        // Iterate layers
        this.layers.forEach(layer => {

            // Colliders
            for (const tileset of this.tilesets.values()) {
                if (layer.class == 'colliders')
                    tileset.ref.debug(view, layer.map, this.offset.x, this.offset.y, tileset.first);
            }

        });

        // Center view correction
        const ox = view.center.x + view.offset.x;
        const oy = view.center.y + view.offset.y;

        // Spawn points
        Object.entries(this.spawnpoints).forEach(([name, points]) => {
            points.forEach(point => {
                // Arrow
                view.ctx.fillStyle = 'rgba(0,255,0,0.8)';
                view.ctx.beginPath();
                const ax = point.x + ox;
                const ay = point.y + oy;
                view.ctx.moveTo(0 + ax, 0 + ay);
                view.ctx.lineTo(-8 + ax, -16 + ay);
                view.ctx.lineTo(8 + ax, -16 + ay);
                view.ctx.fill();
                // Name
                view.ctx.font = "14px sans-serif";
                const txtc = view.ctx.measureText(name).width / 2;
                view.ctx.fillText(name, ax - txtc, ay + 16);
            });
        });

        // Stairs
        view.ctx.fillStyle = 'rgba(0,255,255,0.5)';
        this.stairs.forEach(shape => {
            // Draw path
            view.ctx.beginPath();
            view.ctx.moveTo(shape.x1 + ox, shape.y1 + oy);
            view.ctx.lineTo(shape.x2 + ox, shape.y2 + oy);
            view.ctx.lineTo(shape.x3 + ox, shape.y3 + oy);
            view.ctx.lineTo(shape.x4 + ox, shape.y4 + oy);
            view.ctx.fill();
        });

        // Portals
        view.ctx.fillStyle = 'rgba(50,0,50,0.5)';
        this.portals.forEach(shape => {
            view.ctx.fillRect(
                shape.left + ox,
                shape.top + oy,
                shape.right - shape.left,
                shape.bottom - shape.top
            );
        });

        // Masks
        view.ctx.fillStyle = 'rgba(3, 131, 61, 0.5)';
        this.masks.forEach(shape => {
            view.ctx.fillRect(
                shape.left + ox,
                shape.top + oy,
                shape.right - shape.left,
                shape.bottom - shape.top
            );
        });

        // ZGates (box) with their anchorY seam line
        view.ctx.fillStyle = 'rgba(255, 128, 0, 0.35)';
        view.ctx.strokeStyle = 'rgba(255, 128, 0, 0.9)';
        this.zgates.forEach(gate => {
            view.ctx.fillRect(
                gate.left + ox,
                gate.top + oy,
                gate.right - gate.left,
                gate.bottom - gate.top
            );
            view.ctx.beginPath();
            view.ctx.moveTo(gate.left + ox, gate.anchorY + oy);
            view.ctx.lineTo(gate.right + ox, gate.anchorY + oy);
            view.ctx.stroke();
        });

        // Actors
        Object.values(this.actors).forEach(actorsGroup => {
            // Iterate actors in group
            Object.values(actorsGroup).forEach(actor => {
                actor.debug(view);
            });
        });

        // Bounds
        if (this.bounds.left !== Infinity) {
            view.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            view.ctx.lineWidth = 2;
            view.ctx.strokeRect(
                this.bounds.left + ox,
                this.bounds.top + oy,
                this.bounds.right - this.bounds.left,
                this.bounds.bottom - this.bounds.top
            );
        }

        // View
        if (view.debugEnabled) view.debug();
    }

}
