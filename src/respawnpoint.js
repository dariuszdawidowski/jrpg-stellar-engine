/**
 * Point for respawning
 */

class RespawnPoint extends SpawnPoint {

    /**
     * Constructor
     */

    constructor(args) {
        super(args);

        // Type of the spawn actor (string)
        this.type = args.type;
        // In which level layer (string)
        this.layer = args.layer;
        // Actor info
        this.actor = args.actor;

        // Range count [min, max]
        this.range = args.range;
        // Number of currently spawned actors
        this.count = 0;

        // Timestamp of the last spawn (Number | null)
        this.lastSpawn = null;

        // console.log(this)
    }

    /**
     * Check if there is time for a new spawn - if so, spawn
     */

    respawn() {
        // Spawn immediately
        if (this.lastSpawn == null) {
            return this.spawn();
        }
        // Spawn if max not reached
        else if (this.count < this.range[1]) {
            return this.spawn();
        }
        return null;
    }

    /**
     * Generate spawn args ready for level.spawn(args)
     */

    spawn() {
        this.lastSpawn = Date.now();
        this.count ++;
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            type: this.type,
            layer: this.layer,
            actor: this.actor
        };
    }

}
