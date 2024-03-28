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

        this.characters = {
            player: null,
            npc: null,
            mob: null
        }
    }

}
