class Sprite extends TileSet {

    /**
     * Create sprite
     * All TileSet params plus:
     * @param speed: Number - movement speed (pixels on second)
     * @param anim: Object - map of animations { speed: seconds, idle: [], moveUp: [], moveDown: [], moveLeft: [], moveRight: [] }
     */

    constructor(args) {
        super(args);

        // Stats
        this.stats = {
            speed: args.speed,
        };

        /**
         * Position in space
         * v: vertical action (n=north,s=south)
         * h: horizontal action (w=west,e=east)
         * x,y: screen
         */
        this.transform = {
            v: '',
            h: '',
            x: 0,
            y: 0,
            // wx: 0,
            // wy: 0,
        };

        // Animation map
        this.anim = 'anim' in args ? args.anim : { speed: 0, idle: [], moveUp: [], moveDown: [], moveLeft: [], moveRight: [] };
        this.anim.speed = this.anim.speed / 100.0;

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
        this.frame = this.anim.idle[0];
        this.transform.v = '';
        this.transform.h = '';
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

        // Vertical action
        this.transform.v = 'n';

        // Move
        const pixels = this.stats.speed * deltaTime;
        this.transform.y -= pixels;
        return pixels;
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

        // Vertical action
        this.transform.v = 's';

        // Move
        const pixels = this.stats.speed * deltaTime;
        this.transform.y += pixels;
        return pixels;
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

        // Horizontal action
        this.transform.h = 'e';

        // Move
        const pixels = this.stats.speed * deltaTime
        this.transform.x += pixels;
        return pixels;
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

        // Horizontal action
        this.transform.h = 'w';

        // Move
        const pixels = this.stats.speed * deltaTime;
        this.transform.x -= pixels;
        return pixels;
    }

    /**
     * Calculate collisions
     * @param left: Number - left corner of collision layer
     * @param top: Number - top corner of collision layer
     * @param tiles: [Array] - collision tiles layer
     * @return {up: bool, down: bool, left: bool, right: bool} - allow move in direction
     */

    collide(args) {
        const allow = {up: true, down: true, left: true, right: true};
        return allow;
    }

    /**
     * Render sprite
     * @attr origin {x: Number, y: Number} - scroll correction
     */

    render(origin = {x: 0, y: 0}) {
        super.renderSingle({x: this.transform.x + origin.x, y: this.transform.y + origin.y, nr: this.frame});
    }

}
