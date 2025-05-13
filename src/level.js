/**
 * Level map with all tiles, items and actors
 */

class Level {

    /**
     * Constructor
     */

    constructor() {

        // Center of the coordinate system correction (this is constant not scroll)
        this.offset = {x: 0, y: 0};

        // Scale
        this.scale = 1;

        // Tileset definitions {'tileset id': {ref: TileSet object reference, first: Number of index offset}, ...}
        this.tilesets = {};

        // Environment layers [{name: 'string', class: 'colliders|empty', map: [[]]}, ...]
        this.layers = []; // [class Layer]

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

        // Map global properties
        this.properties = {};

        // Id generation counter
        this.idGen = 0;

        // Loaders
        this.loader = {
            acx: new LoaderACX()
        };

    }

    /**
     * Returns list of all colliders
     */

    getColliders(view) {
        const colliders = [];
        const tileset = Object.values(this.tilesets).length ? Object.values(this.tilesets)[0] : null;
        if (tileset) {
            this.layers.forEach(layer => {
                if (layer.class == 'colliders') {
                    colliders.push(...tileset.ref.getColliders(view, layer.map, this.offset.x, this.offset.y, tileset.first));
                }
            });
        }
        return colliders;
    }

    /**
     * Pre-calucations for stairs
     */

    precalcStairs(view) {
        for (let i = 0; i < this.stairs.length; i ++) {
            this.stairs[i]['left'] = Math.min(this.stairs[i].x1, this.stairs[i].x2, this.stairs[i].x3, this.stairs[i].x4);
            this.stairs[i]['top'] = Math.min(this.stairs[i].y1, this.stairs[i].y2, this.stairs[i].y3, this.stairs[i].y4);
            this.stairs[i]['right'] = Math.max(this.stairs[i].x1, this.stairs[i].x2, this.stairs[i].x3, this.stairs[i].x4);
            this.stairs[i]['bottom'] = Math.max(this.stairs[i].y1, this.stairs[i].y2, this.stairs[i].y3, this.stairs[i].y4);
            this.stairs[i]['angle'] = this.calculateTopEdgeAngle(this.stairs[i]);
        }
    }

    /**
     * Util: finding angle of top edge
     */

    calculateTopEdgeAngle(coordinates) {
        const points = [
            { x: coordinates.x1, y: -coordinates.y1 },
            { x: coordinates.x2, y: -coordinates.y2 },
            { x: coordinates.x3, y: -coordinates.y3 },
            { x: coordinates.x4, y: -coordinates.y4 }
        ];

        points.sort((a, b) => {
            if (a.y !== b.y) {
                return a.y - b.y;
            } else {
                return a.x - b.x;
            }
        });

        const [topPoint1, topPoint2] = points.slice(0, 2);

        let leftPoint, rightPoint;
        if (topPoint1.x < topPoint2.x) {
            leftPoint = topPoint1;
            rightPoint = topPoint2;
        } else {
            leftPoint = topPoint2;
            rightPoint = topPoint1;
        }

        const deltaX = rightPoint.x - leftPoint.x;
        const deltaY = rightPoint.y - leftPoint.y;
        const angleInRadians = Math.atan2(deltaY, deltaX);
        const angleInDegrees = angleInRadians * (180 / Math.PI);

        return angleInDegrees;
    }

    /**
     * Returns list of all stairs/slopes
     */

    getStairs(view) {
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

    respawn() {
        // Iterate through all respawn types
        for (const point of this.respawnpoints) {
            const spawnArgs = point.respawn();
            if (spawnArgs) this.spawn({ ...spawnArgs, point });
        }
    }

    /**
     * Spawn an actor directly
     * @param args.type: string - actor group 'mobs', 'vehicles' etc.
     * @param args.actor: Object - actor's properties for creating instance
     * @param args.layer: string - layer name of the level in which to spawn
     * @param args.point: Object - optional point reference
     */

    spawn(args) {
        // Position in the area range
        const transform = {
            x: args.x + (args.w / 2) + Math.floor(Math.random() * (args.w + 1) - (args.w / 2)),
            y: args.y + (args.h / 2) + Math.floor(Math.random() * (args.h + 1) - (args.h / 2))
        };

        // Crerate instance
        const actorInstance = this.loader.acx.parseActor({ ...args.actor, type: args.type, transform });
        if ('point' in args) actorInstance.spawn = args.point;

        // Generate unique actor's id if none
        if (!actorInstance.id) actorInstance.id = `${args.layer}.${actorInstance.name}.${this.idGen++}`;

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
    }

    /**
     * Despawn an actor
     * @param id: string - actor's unique id
     */

    despawn(id) {
        // Find the actor's type by traversing all actor groups
        for (const type in this.actors) {
            if (id in this.actors[type]) {
                if ('spawn' in this.actors[type][id]) this.actors[type][id].spawn.decrease();
                delete this.actors[type][id];
                return;
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
     * Update all actors
     */

    update(view, deltaTime) {

        // Update tilesets
        for (const tileset of Object.values(this.tilesets)) {
            tileset.ref.update(deltaTime);
        }

        // Gather level colliders
        const colliders = this.getColliders(view);

        // Update all actors
        Object.values(this.actors).forEach(actors => {
            Object.values(actors).forEach(actor => {
                actor.update({
                    view,
                    deltaTime,
                    colliders
                });
            });
        });

    }

    /**
     * Render all layers
     */

    render(view) {

        // Iterate layers
        this.layers.forEach(layer => {

            // Render backgrounds/foregrounds
            if (layer.class == 'image') {
                view.background(
                    layer.src,
                    {x: layer.x * this.scale, y: layer.y * this.scale},
                    {w: layer.w * this.scale, h: layer.h * this.scale},
                    layer.repeat,
                    layer.parallax,
                    layer.coordinates
                );
            }

            // Render actors
            else if (layer.class == 'objects') {

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
                    return (a.transform.y + a.tile.scaled.halfHeight) - (b.transform.y + b.tile.scaled.halfHeight);
                });

                // Render actors
                actors.forEach(actor => {
                    actor.render(view);
                });

            }

            // Render tiles
            else {
                for (const tileset of Object.values(this.tilesets)) {
                    tileset.ref.render(view, layer.map, this.offset.x - layer.offset.x, this.offset.y - layer.offset.y, tileset.first);
                }

            }

        });

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

        // Actors
        Object.values(this.actors).forEach(actorsGroup => {
            // Iterate actors in group
            Object.values(actorsGroup).forEach(actor => {
                actor.debug(view);
            });
        });

        // View
        if (view.debugEnabled) view.debug();
    }

}
