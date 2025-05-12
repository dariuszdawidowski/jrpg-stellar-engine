/**
 * Point for respawning
 */

class RespawnPoint extends SpawnPoint{

    /**
     * Constructor
     */

    constructor(args) {
        super(args);
        this.layer = args.layer;
        this.actor = args.actor;
    }
}
