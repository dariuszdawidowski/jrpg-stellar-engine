/**
 * MOB - mobile object, actor with self-movement
 */

class MOB extends Actor {

    /**
     * Create sprite
     * All params from TileSet+Sprite
     */

    constructor(args) {
        super(args);

        // Current action (used)
        this.action = 'idle';

        // Helper counter for movement (seconds)
        this.duration = 0;

        // Last collision bounce direction (to avoid)
        this.last = [0, 0];

        // Start wander
        this.randomDirection();
    }


    /**
     * Start new wandering
     */

    randomDirection() {
        // Duration of movement (sec)
        this.duration = randomRangeFloat(0.5, 2.5);
        // Available directions without last one
        const directions = [[-1, 0], [0, -1], [1, 0], [0, 1], [0, 0], [0, 0], [0, 0], [0, 0]].filter(d => !(d[0] == this.last[0] && d[1] == this.last[1]));
        // Random direction
        const direction = directions[randomRangeInt(0, directions.length - 1)];
        this.transform.vec.x = this.last[0] = direction[0];
        this.transform.vec.y = this.last[1] = direction[1];
    }

    /**
     * Update every frame
     * @param args.colliders: [array] - list of colliders
     * @param args.deltaTime: Number - delta time since last frame
     */

    update(args) {
        if (this.duration > 0) {
            this.duration -= args.deltaTime;

            // Movement
            if (this.transform.vec.x != 0 || this.transform.vec.y != 0) {
                let [x, y] = this.collide(args.colliders, args.deltaTime);
                this.move(x, y);
                this.animate(null, args.deltaTime);
            }
            // Idle
            else {
                this.animate('idle', args.deltaTime);
            }
        }
        else {
            // Random new wander
            this.randomDirection();
        }
    }

}
