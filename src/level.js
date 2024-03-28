class Level {

    /**
     * Constructor
     */

    constructor() {
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
