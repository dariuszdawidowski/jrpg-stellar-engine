class Engine {

    constructor() {
        this.env = {
            background : null,
            ground : [],
            collison : [],
            cover : []
        };

        this.characters = {
            player : null,
            npc : [],
            mob : []
        }
    }
}