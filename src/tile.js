/**
 * Tile - most basic shape to display based on external atlas
 */

class Tile {

    /**
     * Constructor
     * @param id: string - (optional) unique id
     * @param atlas: Atlas object - sprite atlas
     * @param transform: {x, y, rotation: {angle, offsetX, offsetY}} - (optional) initial position and rotation (deg clockwise up)
     * @param cell: Number - initial cell index (optional)
     * @param scale: Number - scale image (optional)
     */

    constructor(args = {}) {

        // Sprite ID
        this.id = ('id' in args) ? args.id : null;

        // Sprite name
        this.name = ('name' in args) ? args.name : null;

        // Sprite slug
        this.slug = ('slug' in args) ? args.slug : null;

        // Current position in space - x, y, {angle, offsetX, offsetY}: screen
        this.transform = {
            x: ('transform' in args) && ('x' in args.transform) ? args.transform.x : 0,
            y: ('transform' in args) && ('y' in args.transform) ? args.transform.y : 0,
            rotation: ('transform' in args) && ('rotation' in args.transform) ? args.transform.rotation : null,
            clear: function() {
                this.x = this.y = 0;
                this.rotation = null;
            }
        };

        // Sprite atlas
        this.atlas = args.atlas;

        // Dimensions of one tile
        this.size = {
            current: 0, // current frame
            width: this.atlas.width / this.atlas.cols,
            height: this.atlas.height / this.atlas.rows,
            scaled: {
                factor: args.scale || 1,
                width: (this.atlas.width / this.atlas.cols) * (args.scale || 1),
                height: (this.atlas.height / this.atlas.rows) * (args.scale || 1),
                halfWidth: ((this.atlas.width / this.atlas.cols) * (args.scale || 1)) / 2,
                halfHeight: ((this.atlas.height / this.atlas.rows) * (args.scale || 1)) / 2
            }
        };
        this.tile = this.size; // alias for backward compatibility, remove later

        // Origin (scaled center related to top-left corner)
        this.origin = {
            x: this.size.scaled.halfWidth,
            y: this.size.scaled.halfHeight            
        };

        // Optional initial cell
        if ('cell' in args) this.cell(args.cell);

    }

    /**
     * Set coordinates
     * @param x: Number
     * @param y: Number
     */

    position(x, y) {
        this.transform.x = x;
        this.transform.y = y;
    }

    /**
     * Set rotation
     * @param rot: Number
     */

    rotation(angle, offsetX, offsetY) {
        this.transform.rotation = {angle, offsetX, offsetY};
    }

    /**
     * Set/Get current frame cell
     * @param nr: Number
     */

    cell(nr) {
        this.size.current = nr;
    }

    /**
     * Returns screen collider
     */

    getCollider() {
        return {
            left: this.transform.x - this.origin.x,
            top: this.transform.y - this.origin.y,
            right: this.transform.x + this.origin.x,
            bottom: this.transform.y + this.origin.y
        };
    }

    /**
     * Update sprite
     */

    update() {
        /*** Overload ***/
    }

    /**
     * Draw single tile
     * @param view: View context
     */

    render(view) {
        const sx = this.size.width * (this.size.current % this.atlas.cols);
        const sy = this.size.height * Math.floor(this.size.current / this.atlas.cols);
        const d = view.world2Screen({
            x: this.transform.x - this.origin.x,
            y: this.transform.y - this.origin.y,
        });
        
        if (d.x > -this.size.scaled.width && d.x < view.canvas.width && 
            d.y > -this.size.scaled.height && d.y < view.canvas.height) {
            
            if (this.transform.rotation !== null) {
                const centerX = Math.round(d.x) + this.size.scaled.halfWidth;
                const centerY = Math.round(d.y) + this.size.scaled.halfHeight;
                
                view.ctx.save();
                view.ctx.translate(centerX, centerY);
                view.ctx.rotate(this.transform.rotation.angle * Math.PI / 180);
                view.ctx.translate(this.transform.rotation.offsetX, this.transform.rotation.offsetY);
                
                view.ctx.drawImage(
                    this.atlas.image,
                    sx,
                    sy,
                    this.size.width,
                    this.size.height,
                    -this.size.scaled.halfWidth,
                    -this.size.scaled.halfHeight,
                    this.size.scaled.width,
                    this.size.scaled.height
                );
                
                view.ctx.restore();
            } else {
                view.ctx.drawImage(
                    this.atlas.image,
                    sx,
                    sy,
                    this.size.width,
                    this.size.height,
                    Math.round(d.x),
                    Math.round(d.y),
                    this.size.scaled.width,
                    this.size.scaled.height
                );
            }
        }
    }

    /**
     * Debug render
     * @param view: View context
     */

    debug(view) {
        view.ctx.fillStyle = 'rgba(225,0,0,0.5)';
        const my = this.getCollider();
        view.ctx.fillRect(
            my.left + view.center.x + view.offset.x,
            my.top + view.center.y + view.offset.y,
            (my.right + view.center.x + view.offset.x) - (my.left + view.center.x + view.offset.x),
            (my.bottom + view.center.y + view.offset.y) - (my.top + view.center.y + view.offset.y)
        );
    }

}
