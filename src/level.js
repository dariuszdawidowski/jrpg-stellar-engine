/**
 * Level map with all tiles, items and actors
 */

class Level {

    /**
     * Constructor
     * @param args.view: Object - view refernece
     */

    constructor(args) {

        // Center of the coordinate system correction (this is constant not scroll)
        this.offset = {x: 0, y: 0};

        // The furthest tiles in world coordinates (counted automatically)
        this.bounds = {left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity};

        // Scale
        this.scale = 1;

        // Tileset definitions {'tileset id': {ref: TileSet object reference, first: Number of index offset}, ...}
        this.tilesets = {};

        // Tile size
        this.tile = { w: 0, h: 0 };

        // Environment layers [{name: 'string', class: 'colliders|empty', map: [[]]}, ...]
        this.layers = []; // [class Layer]

        // Custom renderers
        this.renderers = {};

        // Actors {type: {'name': object, ...}, ...} for items, chars, npcs, mobs, mounts, vehicles, etc.
        this.actors = {};

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

        // Generic shapes [{name, x, y, points: [{x, y}, ...], properties: {}}, ...]
        this.shapes = [];

        // Texts [{name, x, y, align, text}, ...]
        this.texts = [];

        // Map global properties
        this.properties = {};

        // Id generation counter
        this.idGen = 0;

        // Loaders
        this.loader = {
            acx: new LoaderACX()
        };

        // View reference
        this.view = args.view;

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
        const colliders = [];
        const tileset = Object.values(this.tilesets).length ? Object.values(this.tilesets)[0] : null;
        if (tileset) {
            this.layers.forEach(layer => {
                if (layer.class == 'colliders') {
                    colliders.push(...tileset.ref.getColliders(layer.map, this.offset.x, this.offset.y, tileset.first, margin));
                }
            });
        }
        return colliders;
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

    getSpawnPoint(type, fallback = {x: 0, y: 0}) {
        if (type in this.spawnpoints && this.spawnpoints[type].length > 0) {
            const spawnpoint = this.spawnpoints[type][randomRangeInt(0, this.spawnpoints[type].length - 1)];
            return {x: spawnpoint.x, y: spawnpoint.y};
        }
        return fallback;
    }

    /**
     * Returns all spawn point for given type
     */

    getSpawnPoints(type, fallback = [{x: 0, y: 0}]) {
        if (type in this.spawnpoints && this.spawnpoints[type].length > 0) {
            return this.spawnpoints[type];
        }
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
        if (objectLayer && objectLayer.class === 'objects') {
            if (!objectLayer.actors) objectLayer.actors = [];
            if (!objectLayer.actors.includes(actorInstance.id)) objectLayer.actors.push(actorInstance.id);
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
                const idx = layer.actors.indexOf(id);
                if (idx !== -1) {
                    layer.actors.splice(idx, 1);
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
        for (const tileset of Object.values(this.tilesets)) {
            tileset.ref.update(deltaTime);
        }

        // Gather level colliders
        const colliders = this.getColliders();

        // Update all actors
        Object.values(this.actors).forEach(actors => {
            Object.values(actors).forEach(actor => {
                actor.update({
                    deltaTime,
                    colliders
                });
            });
        });

    }

    /**
     * Render layers (from list or just all of them)
     */

    render(view, layers = null) {

        // Iterate layers
        this.layers.forEach(layer => {

            if (layers && !layers.includes(layer.name)) return;

            // Render backgrounds/foregrounds
            if (layer.class == 'image') this.renderImageLayer(view, layer);

            // Render actors
            else if (layer.class == 'objects') this.renderObjectsLayer(view, layer);

            // Render tiles
            else if (layer.class == 'tiles' || layer.class == 'colliders') this.renderTilesLayer(view, layer);

            // Render custom
            else this.renderCustomLayer(view, layer);

        });

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
     * Render objects layer
     */

    renderObjectsLayer(view, layer) {

        // Visible actors
        const actors = [];

        // Collect culled actors
        Object.values(this.actors).forEach(actorsGroup => {
            // Iterate actors in group
            Object.entries(actorsGroup).forEach(([actorId, actor]) => {
                // Iterate actor IDs in the current layer
                layer.actors.forEach(actorIdOnLayer => {
                    if (actorIdOnLayer == actorId) {
                        const pos = view.world2Screen({
                            x: actor.transform.x - actor.tile.scaled.halfWidth,
                            y: actor.transform.y - actor.tile.scaled.halfHeight
                        });
                        if (pos.x > -actor.tile.scaled.width && pos.x < view.canvas.width + actor.tile.scaled.width && pos.y > -actor.tile.scaled.height && pos.y < view.canvas.height + actor.tile.scaled.height) actors.push(actor);
                    }
                });
            });
        });

        // Sort actors
        actors.sort(function(a, b) {
            return (a.transform.y - a.origin.y + a.tile.scaled.halfHeight) - (b.transform.y - b.origin.y + b.tile.scaled.halfHeight);
        });

        // Render actors
        actors.forEach(actor => {
            actor.render(view);
        });

    }

    /**
     * Render tiles layer
     */

    renderTilesLayer(view, layer) {
        for (const tileset of Object.values(this.tilesets)) {
            tileset.ref.render(view, layer.map, this.offset.x - layer.offset.x, this.offset.y - layer.offset.y, tileset.first);
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
            for (const tileset of Object.values(this.tilesets)) {
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
