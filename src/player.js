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
        this.bounds = 'bounds' in args ? args.bounds : {top: 0, bottom: 0, left: 0, right: 0};
    }

    /**
     * Up movement
     */

    moveUp(pixels, view) {

        // Vertical action
        // this.transform.v = 'n';
        this.transform.vec.y = -1;

        // Advance scroll
        if (this.transform.y + view.offset.y < this.bounds.top) view.offset.y += pixels;

        // Actor movement
        return super.moveUp(pixels);
    }

    /**
     * Down movement
     */

    moveDown(pixels, view) {

        // Vertical action
        // this.transform.v = 's';
        this.transform.vec.y = 1;

        // Advance scroll
        if (this.transform.y + view.offset.y > this.bounds.bottom) view.offset.y -= pixels;

        // Actor movement
        return super.moveDown(pixels);
    }

    /**
     * Right movement
     */

    moveRight(pixels, view) {

        // Horizontal action
        // this.transform.h = 'e';
        this.transform.vec.x = 1;

        // Advance scroll
        if (this.transform.x + view.offset.x > this.bounds.right) view.offset.x -= pixels;

        // Actor movement
        return super.moveRight(pixels);
    }

    /**
     * Left movement
     */

    moveLeft(pixels, view) {

        // Horizontal action
        // this.transform.h = 'w';
        this.transform.vec.x = -1;

        // Advance scroll
        if (this.transform.x + view.offset.x < this.bounds.left) view.offset.x += pixels;

        // Actor movement
        return super.moveLeft(pixels);
    }

}
