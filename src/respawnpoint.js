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
        // Delay count [min, max]
        this.delay = args.delay;
        // Next Delay
        this.next = 0;
        // Timestamp of the last spawn (Number | null)
        this.lastSpawn = null;
    }

    /**
     * Check if there is time for a new spawn - if so, spawn
     */

    respawnCheck() {
        // Spawn immediately
        if (this.lastSpawn == null) {
            const spawn = this.spawnArgs();
            return spawn;
        }
        // Spawn at least minimum amount
        else if (this.count < this.range[0]) {
            const spawn = this.spawnArgs();
            return spawn;
        }
        // Optionally spawn if max not reached (Check if 10 seconds have passed since last spawn)
        else if (this.count < this.range[1] && Date.now() - this.lastSpawn >= this.next) {
            const spawn = this.spawnArgs();
            return spawn;
        }
        return null;
    }

    /**
     * Generate spawn args ready for level.spawn(args)
     */

    spawnArgs() {
        this.count ++;
        this.lastSpawn = Date.now();
        this.next = randomRangeInt(this.delay[0] * 1000, this.delay[1] * 1000);
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

    /**
     * Decrease number of spawned actors
     */

    decrease() {
        this.count --;
        this.lastSpawn = Date.now();
        this.next = randomRangeInt(this.delay[0] * 1000, this.delay[1] * 1000);
    }

}
