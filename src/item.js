class Item extends TileSet {

    /**
     * Create sprite
     * All params from TileSet plus:
     */

    constructor(args) {
        super(args);

        /**
         * Position in space
         * x,y: screen
         */
        this.transform = {
            x: 0,
            y: 0
        };

        // Collider
        this.collider = 'collider' in args ? args.collider : null;

    }

    /**
     * Render sprite
     * @attr origin {x: Number, y: Number} - scroll correction
     */

    render(origin = {x: 0, y: 0}) {
        super.renderSingle({x: this.transform.x + origin.x, y: this.transform.y + origin.y, nr: 0});
    }

}
