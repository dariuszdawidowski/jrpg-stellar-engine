/**
 * Sprite - most basic shape to display
 */

class Sprite {

    /**
     * Constructor
     * @param id: string - optional unique id
     * @param name: string - name for the sprite
     * @param transform: {x, y, rotation: {angle, offsetX, offsetY}} - initial position and rotation (deg clockwise up)
     * @param resource: string - selector for image preloaded resource
     * @param width: Number - image width in pixels
     * @param height: Number - image height in pixels
     * @param cols: Number - number of columns in atlas (optional)
     * @param rows: Number - number of rows in atlas (optional)
     * @param cell: Number - grid cell size in pixels instead of providing rows and cols (optional)
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
        this.atlas = {
            width: args.width,
            height: args.height,
            cols: 'cell' in args ? args.width / args.cell : args.cols || 1,
            rows: 'cell' in args ? args.height / args.cell : args.rows || 1,
            cell: 'cell' in args ? args.cell : args.width / args.cols,
            image: null
        };

        // Load image from HTML
        if (typeof(args.resource) == 'string' && args.resource.startsWith('#')) {
            this.atlas.image = document.querySelector(args.resource);
        }
        // Load image from URL
        else if (typeof(args.resource) == 'string') {
            this.atlas.image = Cache.getImage(args.resource);
        }
        // Preloaded image
        else if (typeof(args.resource) == 'object') {
            this.atlas.image = args.resource;
        }

        // Dimensions of one tile
        this.tile = {
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

        // Origin (scaled center related to top-left corner)
        this.origin = {
            x: this.tile.scaled.halfWidth,
            y: this.tile.scaled.halfHeight            
        };

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
        this.tile.current = nr;
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
     * Draw single tile
     * @param view: View context
     */

    render(view) {
        const sx = this.tile.width * (this.tile.current % this.atlas.cols);
        const sy = this.tile.height * Math.floor(this.tile.current / this.atlas.cols);
        const d = view.world2Screen({
            x: this.transform.x - this.origin.x,
            y: this.transform.y - this.origin.y,
        });
        
        if (d.x > -this.tile.scaled.width && d.x < view.canvas.width && 
            d.y > -this.tile.scaled.height && d.y < view.canvas.height) {
            
            if (this.transform.rotation !== null) {
                const centerX = Math.round(d.x) + this.tile.scaled.halfWidth;
                const centerY = Math.round(d.y) + this.tile.scaled.halfHeight;
                
                view.ctx.save();
                view.ctx.translate(centerX, centerY);
                view.ctx.rotate(this.transform.rotation.angle * Math.PI / 180);
                view.ctx.translate(this.transform.rotation.offsetX, this.transform.rotation.offsetY);
                
                view.ctx.drawImage(
                    this.atlas.image,
                    sx,
                    sy,
                    this.tile.width,
                    this.tile.height,
                    -this.tile.scaled.halfWidth,
                    -this.tile.scaled.halfHeight,
                    this.tile.scaled.width,
                    this.tile.scaled.height
                );
                
                view.ctx.restore();
            } else {
                view.ctx.drawImage(
                    this.atlas.image,
                    sx,
                    sy,
                    this.tile.width,
                    this.tile.height,
                    Math.round(d.x),
                    Math.round(d.y),
                    this.tile.scaled.width,
                    this.tile.scaled.height
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
