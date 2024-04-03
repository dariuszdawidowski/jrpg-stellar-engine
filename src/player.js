class Player extends Actor {

    /**
     * Create sprite
     * All params from TileSet+Sprite plus:
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

        // Vertical action
        this.transform.v = 'n';

        // Transform but no scroll
        if (this.scroll && this.transform.y > this.scroll.top) {
            this.transform.y -= pixels;
            return 0;
        }

        // Scroll only
        return pixels;
    }

    /**
     * Down movement
     */

    moveDown(pixels) {

        // Vertical action
        this.transform.v = 's';

        // Transform but no scroll
        if (this.scroll && this.transform.y < this.scroll.bottom) {
            this.transform.y += pixels;
            return 0;
        }

        // Scroll only
        return pixels;
    }

    /**
     * Right movement
     */

    moveRight(pixels) {

        // Horizontal action
        this.transform.h = 'e';

        // Transform but no scroll
        if (this.scroll && this.transform.x < this.scroll.right) {
            this.transform.x += pixels;
            return 0;
        }

        // Scroll only
        return pixels;
    }

    /**
     * Left movement
     */

    moveLeft(pixels) {

        // Horizontal action
        this.transform.h = 'w';

        // Transform but no scroll
        if (this.scroll && this.transform.x > this.scroll.left) {
            this.transform.x -= pixels;
            return 0;
        }

        // Scroll only
        return pixels;
    }

}
