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

        // Direction of movement L=left U=up R=right D=down I=idle
        this.direction = '';

        // Helper counter for movement (seconds)
        this.duration = 0;

        // Last collision bounce direction (to avoid)
        this.bounced = '';

        // Start wander
        this.wander();
    }


    /**
     * Start wandering around
     */

    wander() {
        this.duration = randomRangeFloat(0.5, 2.0);
        // Available directions without last bounced
        const directions = ['L', 'U', 'R', 'D', 'I'].filter(direction => direction !== this.bounced);
        // Random direction
        this.direction = directions[randomRangeInt(0, directions.length - 1)];
        // Assign action
        if (this.direction == 'I') {
            this.action = 'idle';
        }
        else {
            this.action = 'wander';
            this.bounced = '';
        }
    }

    /**
     * Update every frame
     * @param args.view: View context
     * @param args.deltaTime: Number - delta time since last frame
     * @param args.colliders: [array] - list of colliders
     */

    update(args) {
        if (this.duration > 0) {
            this.duration -= args.deltaTime;

            // IDLE
            if (this.action == 'idle') {

                // Idle
                if (this.direction == 'I') {
                    this.action = 'idle';
                    this.animate('idle', args.deltaTime);
                    this.transform.v = '';
                    this.transform.h = '';
                }

            }

            // WANDER
            else if (this.action == 'wander') {

                // Wander up
                if (this.direction == 'U') {

                    // Collision detection
                    const [x, y] = this.collideUp({
                        view: args.view,
                        deltaTime: args.deltaTime,
                        with: args.colliders
                    });

                    // Slide

                    // Bounce
                    if (y < 0.001) {
                        this.wander();
                        this.bounced = 'U';
                    }

                    // Animate
                    this.animate('moveUp', args.deltaTime);

                    // Translate
                    this.moveUp(Math.round(y));
                }

                // Wander down
                else if (this.direction == 'D') {
                    const [x, y] = this.collideDown({
                        view: args.view,
                        deltaTime: args.deltaTime,
                        with: args.colliders
                    });
                    if (y < 0.001) {
                        this.wander();
                        this.bounced = 'D';
                    }
                    this.animate('moveDown', args.deltaTime);
                    this.moveDown(Math.round(y));
                }

                // Wander left
                if (this.direction == 'L') {
                    const [x, y] = this.collideLeft({
                        view: args.view,
                        deltaTime: args.deltaTime,
                        with: args.colliders
                    });
                    if (x < 0.001) {
                        this.wander();
                        this.bounced = 'L';
                    }
                    this.animate('moveLeft', args.deltaTime);
                    this.moveLeft(Math.round(x));
                }

                // Wander right
                else if (this.direction == 'R') {
                    const [x, y] = this.collideRight({
                        view: args.view,
                        deltaTime: args.deltaTime,
                        with: args.colliders
                    });
                    if (x < 0.001) {
                        this.wander();
                        this.bounced = 'R';
                    }
                    this.animate('moveRight', args.deltaTime);
                    this.moveRight(Math.round(x));
                }
            }
        }
        else {
            // Random new direction
            this.wander();
        }
    }

}
