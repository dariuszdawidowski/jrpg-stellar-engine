/*** Level ***/

class Level {

    /**
     * Constructor
     */

    constructor() {

        // Center of the coordinate system correction (this is constant not scroll)
        this.offset = {x: 0, y: 0};

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

    }

    /**
     * Render all layers
     */

    render(context) {

        // Iterate tilesets for ground
        for (const tileset of Object.values(this.tilesets)) {

            // Ground
            tileset.ref.render(context, this.env.ground, this.offset.x, this.offset.y, tileset.first);

            // Water
            tileset.ref.render(context, this.env.water, this.offset.x, this.offset.y, tileset.first);

            // Colliders
            tileset.ref.render(context, this.env.colliders, this.offset.x, this.offset.y, tileset.first);

        }

        // Items
        Object.values(this.items).forEach(item => item.render(context));

        // Characters
        Object.values(this.chars).forEach(character => character.render(context));

        // Iterate tilesets for top
        for (const tileset of Object.values(this.tilesets)) {

            // Cover
            tileset.ref.render(context, this.env.cover, this.offset.x, this.offset.y, tileset.first);

        }

    }

    /**
     * Render debug info
     */

    debug(context) {

        // Colliders
        for (const tileset of Object.values(this.tilesets)) {
            tileset.ref.debug(context, this.env.colliders, this.offset.x, this.offset.y, tileset.first);
        }

        // Characters
        Object.values(this.chars).forEach(character => character.debug(context));
    }


}
