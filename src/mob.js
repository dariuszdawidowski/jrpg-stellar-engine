class MOB extends Sprite {

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
        this.duration = random(1, 3);
        this.direction = Math.floor(random(0, 4));
    }

    /**
     * Update every frame
     * @param args.deltaTime: Number - delta time since last frame
     * @param args.left: Number - current x screen offset
     * @param args.top: Number - current y screen offset
     * @param args.tiles: object - colliders layer
     * @param args.edge: Number - edge size
     */

    update(args) {
        if (this.duration > 0) {
            this.duration -= args.deltaTime;
            switch(this.action) {

                // Wandering movement
                case 'wander':
                    if (this.direction == 1) {
                        // const pixels = this.collideUp(args);
                        const pixels = this.stats.speed * args.deltaTime;
                        if (pixels < 0.001) this.wander();
                        this.animUp(args.deltaTime);
                        this.moveUp(Math.max(Math.round(pixels), 1));
                    }
                    else if (this.direction == 3) {
                        // const pixels = player.collideDown(args);
                        const pixels = this.stats.speed * args.deltaTime;
                        if (pixels < 0.001) this.wander();
                        this.animDown(args.deltaTime);
                        this.moveDown(Math.max(Math.round(pixels), 1));
                    }
                    if (this.direction == 0) {
                        // const pixels = this.collideLeft(args);
                        const pixels = this.stats.speed * args.deltaTime;
                        if (pixels < 0.001) this.wander();
                        this.animLeft(args.deltaTime);
                        this.moveLeft(Math.max(Math.round(pixels), 1));
                    }
                    else if (this.direction == 2) {
                        // const pixels = this.collideRight(args);
                        const pixels = this.stats.speed * args.deltaTime;
                        if (pixels < 0.001) this.wander();
                        this.animRight(args.deltaTime);
                        this.moveRight(Math.max(Math.round(pixels), 1));
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
