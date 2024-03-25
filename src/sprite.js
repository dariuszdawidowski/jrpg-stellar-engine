class Sprite extends TileGrid {

    /**
     * Create sprite
     * @param all Tile params plus:
     * @param speed: Number - movement speed (pixels on second)
     * @param anim: Object - map of animations { speed: seconds, idle: [], moveUp: [], moveDown: [], moveLeft: [], moveRight: [] }
     */

    constructor(args) {
        super(args);

        // Position in space
        this.transform = {
            x : 0,
            y : 0,
            speed: args.speed,
        };

        // Animation map
        this.anim = 'anim' in args ? args.anim : { speed: 0, idle: [], moveUp: [], moveDown: [], moveLeft: [], moveRight: [] };

        // Current frame
        this.frame = 0;

        // Current frame counter (horizontal movement)
        this.frameCounterH = 0;

        // Time of the last animation frame (horizontal movement)
        this.frameTimeH = this.anim.speed;

        // Current frame counter (vertical movement)
        this.frameCounterV = 0;

        // Time of the last animation frame (vertical movement)
        this.frameTimeV = this.anim.speed;
    }

    /**
     * Idle movement
     */

    idle() {
    }

    /**
     * Up movement
     */

    moveUp(deltaTime) {

        // Anim
        this.frameTimeV -= deltaTime;
        if (this.frameTimeV <= 0) {
            this.frameTimeV = this.anim.speed - this.frameTimeV;
            this.frameCounterV ++;
            if (this.frameCounterV == this.anim.moveUp.length) this.frameCounterV = 0;
        }
        this.frame = this.anim.moveUp[this.frameCounterV];

        // Move
        this.transform.y -= this.transform.speed * deltaTime;
    }

    /**
     * Down movement
     */

    moveDown(deltaTime) {

        // Anim
        this.frameTimeV -= deltaTime;
        if (this.frameTimeV <= 0) {
            this.frameTimeV = this.anim.speed - this.frameTimeV;
            this.frameCounterV ++;
            if (this.frameCounterV == this.anim.moveDown.length) this.frameCounterV = 0;
        }
        this.frame = this.anim.moveDown[this.frameCounterV];

        // Move
        this.transform.y += this.transform.speed * deltaTime;
    }

    /**
     * Right movement
     */

    moveRight(deltaTime) {

        // Anim
        this.frameTimeH -= deltaTime;
        if (this.frameTimeH <= 0) {
            this.frameTimeH = this.anim.speed - this.frameTimeH;
            this.frameCounterH ++;
            if (this.frameCounterH == this.anim.moveRight.length) this.frameCounterH = 0;
        }
        this.frame = this.anim.moveRight[this.frameCounterH];

        // Move
        this.transform.x += this.transform.speed * deltaTime;
    }

    /**
     * Left movement
     */

    moveLeft(deltaTime) {

        // Anim
        this.frameTimeH -= deltaTime;
        if (this.frameTimeH <= 0) {
            this.frameTimeH = this.anim.speed - this.frameTimeH;
            this.frameCounterH ++;
            if (this.frameCounterH == this.anim.moveLeft.length) this.frameCounterH = 0;
        }
        this.frame = this.anim.moveLeft[this.frameCounterH];

        // Move
        this.transform.x -= this.transform.speed * deltaTime;
    }

    /**
     * Render sprite
     */

    render() {
        super.render({x: this.transform.x, y: this.transform.y, nr: this.frame});
    }

}
