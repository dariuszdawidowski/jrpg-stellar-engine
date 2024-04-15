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

        // Items
        this.items = {};

        // Characters
        this.chars = {};

        // Spawn points {'player': [{x, y}, ...], 'mob': [{x, y}, ...], ...}
        this.spawnpoints = {};

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

            // Render objects
            else if (layer.class == 'image') {
                view.background(layer.src, {w: layer.w, h: layer.h}, layer.repeat);
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

        // Items
        Object.values(this.items).forEach(item => item.debug(view));

        // Characters
        Object.values(this.chars).forEach(character => character.debug(view));
    }


}
