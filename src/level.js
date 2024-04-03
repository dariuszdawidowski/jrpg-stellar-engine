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

    }

    /**
     * Render layers
     */

    render(context) {

        // Iterate tilesets
        for (const tileset of Object.values(this.tilesets)) {

            // Ground
            tileset.ref.render(context, this.env.ground, this.offset.x, this.offset.y, tileset.first);

            // Colliders
            tileset.ref.render(context, this.env.colliders, this.offset.x, this.offset.y, tileset.first);

            // Cover
            tileset.ref.render(context, this.env.cover, this.offset.x, this.offset.y, tileset.first);

            // Water
            tileset.ref.render(context, this.env.water, this.offset.x, this.offset.y, tileset.first);
        }

    }

    /**
     * Render all items
     */

    // renderItems(scroll) {
    //     Object.values(this.items).forEach(item => item.render(scroll));
    // }

}
