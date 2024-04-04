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

        // Environment layers
        this.env = {
            background: null,
            ground: [],
            colliders: [],
            cover: [],
            water: []
        };

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
        const tileset = Object.values(this.tilesets).length ? Object.values(this.tilesets)[0] : null;
        if (tileset) return tileset.ref.getColliders(view, this.env.colliders, this.offset.x, this.offset.y, tileset.first);
        return [];
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

        // Iterate tilesets for ground
        for (const tileset of Object.values(this.tilesets)) {

            // Ground
            tileset.ref.render(view, this.env.ground, this.offset.x, this.offset.y, tileset.first);

            // Water
            tileset.ref.render(view, this.env.water, this.offset.x, this.offset.y, tileset.first);

            // Colliders
            tileset.ref.render(view, this.env.colliders, this.offset.x, this.offset.y, tileset.first);

        }

        // Items
        Object.values(this.items).forEach(item => item.render(view));

        // Characters
        Object.values(this.chars).forEach(character => character.render(view));

        // Iterate tilesets for top
        for (const tileset of Object.values(this.tilesets)) {

            // Cover
            tileset.ref.render(view, this.env.cover, this.offset.x, this.offset.y, tileset.first);

        }

    }

    /**
     * Render debug info
     */

    debug(view) {

        // Colliders
        for (const tileset of Object.values(this.tilesets)) {
            tileset.ref.debug(view, this.env.colliders, this.offset.x, this.offset.y, tileset.first);
        }

        // Items
        Object.values(this.items).forEach(item => item.debug(view));

        // Characters
        Object.values(this.chars).forEach(character => character.debug(view));
    }


}
