class Level {

    /**
     * Constructor
     */

    constructor() {

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

    }

    /**
     * Render layers
     */

    render(context) {

        // Iterate tilesets
        for (const tileset of Object.values(this.tilesets)) {

            // Ground
            tileset.ref.render(context, this.env.ground, tileset.first);

            // Colliders
            tileset.ref.render(context, this.env.colliders, tileset.first);

            // Cover
            tileset.ref.render(context, this.env.cover, tileset.first);

            // Water
            tileset.ref.render(context, this.env.water, tileset.first);
        }

    }

    /**
     * Render all items
     */

    renderItems(scroll) {
        Object.values(this.items).forEach(item => item.render(scroll));
    }

}
