/**
 * Player - actor with scroll handling
 */

class Player extends Actor {

    /**
     * Create sprite
     * All params from TileSet+Sprite plus:
     * @param bounds: Object - range for scroll { top: Number, bottom: Number, left: Number, right: Number }
     */

    constructor(args) {
        super(args);

        // Scroll range
        this.bounds = 'bounds' in args ? args.bounds : null;
    }

    /**
     * Up movement
     */

    moveUp(pixels, view) {

        // Vertical action
        this.transform.v = 's';

        // Advance scroll
        view.offset.y += pixels;

        // Actor movement        
        return super.moveUp(pixels);
/*
        // Vertical action
        this.transform.v = 'n';

        // Transform but no scroll
        if (this.scroll && this.transform.y > this.scroll.top) {
            this.transform.y -= pixels;
            return 0;
        }

        // Scroll only
        return pixels;
*/
    }

    /**
     * Down movement
     */

    moveDown(pixels, view) {

        // Vertical action
        this.transform.v = 's';

        // Advance scroll
        view.offset.y -= pixels;

        // Actor movement        
        return super.moveDown(pixels);
/*
        // Vertical action
        this.transform.v = 's';

        // Transform but no scroll
        if (this.scroll && this.transform.y < this.scroll.bottom) {
            this.transform.y += pixels;
            return 0;
        }

        // Scroll only
        return pixels;
*/
    }

    /**
     * Right movement
     */

    moveRight(pixels, view) {

        // Horizontal action
        this.transform.h = 'w';

        // Advance scroll
        view.offset.x -= pixels;

        // Actor movement        
        return super.moveRight(pixels);
/*
        // Horizontal action
        this.transform.h = 'e';

        // Transform but no scroll
        if (this.scroll && this.transform.x < this.scroll.right) {
            this.transform.x += pixels;
            return 0;
        }

        // Scroll only
        return pixels;
*/
    }

    /**
     * Left movement
     */

    moveLeft(pixels, view) {

        // Horizontal action
        this.transform.h = 'w';

        // Advance scroll
        view.offset.x += pixels;

        // Actor movement        
        return super.moveLeft(pixels);
/*
        // Horizontal action
        this.transform.h = 'w';

        // Transform but no scroll
        if (this.scroll && this.transform.x > this.scroll.left) {
            this.transform.x -= pixels;
            return 0;
        }

        // Scroll only
        return pixels;*/
    }

}
