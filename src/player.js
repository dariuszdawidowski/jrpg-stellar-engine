class Player extends Sprite {

    /**
     * Create sprite
     * Sll TileSet+Sprite params plus:
     * @param scroll: Object - range for scroll { top: Number, bottom: Number, left: Number, right: Number }
     */

    constructor(args) {
        super(args);

        // Scroll range
        this.scroll = 'scroll' in args ? args.scroll : null;
    }

    /**
     * Up movement
     */

    moveUp(pixels) {

        // Transform but no scroll
        if (this.scroll && this.transform.y > this.scroll.top) {
            this.transform.y -= pixels;
            return 0;
        }

        // Scroll only
        return pixels;
    }

/*
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
        // this.transform.wy -= pixels;
        if (this.scroll && this.transform.y > this.scroll.top) {
            this.transform.y -= pixels;
            return 0;
        }

        return pixels;
    }
*/
    /**
     * Down movement
     */

    moveDown(pixels) {

        // Transform but no scroll
        if (this.scroll && this.transform.y < this.scroll.bottom) {
            this.transform.y += pixels;
            return 0;
        }

        // Scroll only
        return pixels;
    }

/*
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
        // this.transform.wy += pixels;
        if (this.scroll && this.transform.y < this.scroll.bottom) {
            this.transform.y += pixels;
            return 0;
        }

        return pixels;
    }
*/
    /**
     * Right movement
     */

    moveRight(pixels) {

        // Transform but no scroll
        if (this.scroll && this.transform.x < this.scroll.right) {
            this.transform.x += pixels;
            return 0;
        }

        // Scroll only
        return pixels;
    }

/*
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
        // this.transform.wx += pixels;
        if (this.scroll && this.transform.x < this.scroll.right) {
            this.transform.x += pixels;
            return 0;
        }

        return pixels;
    }
*/
    /**
     * Left movement
     */

    moveLeft(pixels) {

        // Transform but no scroll
        if (this.scroll && this.transform.x > this.scroll.left) {
            this.transform.x -= pixels;
            return 0;
        }

        // Scroll only
        return pixels;
    }

/*
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
        // this.transform.wx -= pixels;
        if (this.scroll && this.transform.x > this.scroll.left) {
            this.transform.x -= pixels;
            return 0;
        }

        return pixels;
    }
*/
}
