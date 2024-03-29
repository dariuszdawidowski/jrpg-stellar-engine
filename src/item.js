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
            x: ('transform' in args) && ('x' in args.transform) ? args.transform.x : 0,
            y: ('transform' in args) && ('y' in args.transform) ? args.transform.y : 0
        };

        // Collider
        this.collider = 'collider' in args ? args.collider : null;

        // Animation map
        this.anim = 'anim' in args ? args.anim : null;

        // Current frame
        this.frame = 0;

    }

    /**
     * Switch active animation
     */

    animate(name) {
        this.frame = this.anim[name];
    }

    /**
     * Debug render own collider shape
     */

    debugDrawCollider(scroll = {x: 0, y: 0}) {
        this.context.fillStyle = 'rgba(225,0,0,0.5)';
        this.context.fillRect(
            this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x + scroll.x,
            this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y + scroll.y,
            this.collider.width * this.tile.scaled.factor,
            this.collider.height * this.tile.scaled.factor
        );
    }

    /**
     * Render sprite
     * @param scroll {x: Number, y: Number} - scroll correction
     */

    render(scroll = {x: 0, y: 0}) {
        super.renderSingle({x: this.transform.x + scroll.x, y: this.transform.y + scroll.y, nr: this.frame});
    }

}
