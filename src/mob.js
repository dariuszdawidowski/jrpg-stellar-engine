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

        // Current action
        this.action = 'idle';

        // Direction of movement 0=left 1=top 2=right 3=bottom
        this.direction = 3;

        // Helper counter for actions (seconds)
        this.duration = 0;

        // Start wandewr
        this.wander();
    }

    /**
     * Stop and do nothing
     */

    idle() {
        this.action = 'idle';
        this.duration = 0;
        this.direction = 3;
        super.idle();
    }

    /**
     * Start wandering around
     */

    wander() {
        this.action = 'wander';
        this.duration = randomRangeInt(1, 2);
        this.direction = randomRangeInt(0, 4);
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
            switch(this.action) {

                // Wandering movement
                case 'wander':
                    if (this.direction > 3) {
                        this.frame = this.animations.idle[0];
                        this.transform.v = '';
                        this.transform.h = '';
                    }
                    else if (this.direction == 1) {
                        const [x, y] = this.collideUp({
                            view: args.view,
                            deltaTime: args.deltaTime,
                            with: args.colliders
                        });
                        if (y < 0.001) this.wander();
                        this.animate('moveUp', args.deltaTime);
                        this.moveUp(Math.round(y));
                    }
                    else if (this.direction == 3) {
                        const [x, y] = this.collideDown({
                            view: args.view,
                            deltaTime: args.deltaTime,
                            with: args.colliders
                        });
                        if (y < 0.001) this.wander();
                        this.animate('moveDown', args.deltaTime);
                        this.moveDown(Math.round(y));
                    }
                    if (this.direction == 0) {
                        const [x, y] = this.collideLeft({
                            view: args.view,
                            deltaTime: args.deltaTime,
                            with: args.colliders
                        });
                        if (x < 0.001) this.wander();
                        this.animate('moveLeft', args.deltaTime);
                        this.moveLeft(Math.round(x));
                    }
                    else if (this.direction == 2) {
                        const [x, y] = this.collideRight({
                            view: args.view,
                            deltaTime: args.deltaTime,
                            with: args.colliders
                        });
                        if (x < 0.001) this.wander();
                        this.animate('moveRight', args.deltaTime);
                        this.moveRight(Math.round(x));
                    }
                    break;
            }
        }
        else {
            switch(this.action) {
                case 'wander':
                    this.wander();
                    break;
            }
        }
    }

}
