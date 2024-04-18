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
        this.layers = [];

        // Items {'name/id': object, ...}
        this.items = {};

        // Characters {'name/id': Actor-like object, ...}
        this.chars = {};

        // Spawn points {'player': [{x, y}, ...], 'mob': [{x, y}, ...], ...}
        this.spawnpoints = {};

        // Stairs [{x1, y1, x2, y2, x3, y3, x4, y4}, ...] from left-top clockwise in world coordinates
        this.stairs = [];

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
     * Returns spawn point
     */

    getSpawnPoint(type, fallback = {x: 0, y: 0}) {
        if (type in this.spawnpoints && this.spawnpoints[type].length > 0) {
            const spawnpoint = this.spawnpoints[type][randomRangeInt(0, this.spawnpoints[type].length - 1)];
            return {x: (spawnpoint.x - this.offset.x) * this.scale, y: (spawnpoint.y - this.offset.y) * this.scale};
        }
        return fallback;
    }

    /**
     * Render all layers
     */

    render(view) {

        // Iterate layers
        this.layers.forEach(layer => {

            // Render objects
            if (layer.class == 'objects') {

                // Items
                Object.values(this.items).forEach(item => item.render(view));

                // Characters
                const characters = [];

                // Cull characters
                Object.values(this.chars).forEach(character => {
                    const pos = view.world2Screen(character);
                    if (pos.x > -100 && pos.x < view.canvas.width + 100 && pos.y > -100 && pos.y < view.canvas.height + 100) characters.push(character);
                });

                // Sort characters
                characters.sort(function(a, b) {
                    return (a.transform.y + a.tile.scaled.halfHeight) - (b.transform.y + b.tile.scaled.halfHeight);
                });

                // Render characters
                characters.forEach(character => {
                    character.render(view);
                });
            }

            // Render backgrounds/foregrounds
            else if (layer.class == 'image') {
                view.background(layer.src, {w: layer.w * this.scale, h: layer.h * this.scale}, layer.repeat, layer.parallax);
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
                if (layer.class == 'colliders') tileset.ref.debug(view, layer.map, this.offset.x, this.offset.y, tileset.first);
            }

        });

        // Spawn points
        Object.entries(this.spawnpoints).forEach(([name, points]) => {
            points.forEach(point => {
                // Arrow
                view.ctx.fillStyle = 'rgba(0,255,0,0.8)';
                view.ctx.beginPath();
                const ax = ((point.x - this.offset.x) * this.scale) + view.center.x + view.offset.x;
                const ay = ((point.y - this.offset.y) * this.scale) + view.center.y + view.offset.y;
                view.ctx.moveTo(0 + ax, 0 + ay);
                view.ctx.lineTo(-8 + ax, -16 + ay);
                view.ctx.lineTo(8 + ax, -16 + ay);
                view.ctx.fill();
                // Name
                view.ctx.font = "14px sans-serif";
                view.ctx.fillText(name, ax, 16 + ay);
            });
        });

        // Stairs
        this.stairs.forEach(shape => {
            // Draw path
            view.ctx.fillStyle = 'rgba(0,255,255,0.5)';
            view.ctx.beginPath();
            const ox = view.center.x + view.offset.x;
            const oy = view.center.y + view.offset.y;
            view.ctx.moveTo(((shape.x1 - this.offset.x) * this.scale) + ox, ((shape.y1 - this.offset.y) * this.scale) + oy);
            view.ctx.lineTo(((shape.x2 - this.offset.x) * this.scale) + ox, ((shape.y2 - this.offset.y) * this.scale) + oy);
            view.ctx.lineTo(((shape.x3 - this.offset.x) * this.scale) + ox, ((shape.y3 - this.offset.y) * this.scale) + oy);
            view.ctx.lineTo(((shape.x4 - this.offset.x) * this.scale) + ox, ((shape.y4 - this.offset.y) * this.scale) + oy);
            view.ctx.fill();
        });

        // Items
        Object.values(this.items).forEach(item => item.debug(view));

        // Characters
        Object.values(this.chars).forEach(character => character.debug(view));

        // View
        view.debug();
    }


}
