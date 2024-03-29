class Level {

    /**
     * Constructor
     */

    constructor() {

        // Tileset definitions {'tileset id': Number of starting index}
        this.tileset = {};

        // Environment layers
        this.env = {
            background: null,
            ground: [],
            colliders: [],
            cover: []
        };

        // Items
        this.items = {};

    }

    /**
     * Render all items
     */

    renderItems(scroll) {
        Object.values(this.items).forEach(item => item.render(scroll));
    }

}
