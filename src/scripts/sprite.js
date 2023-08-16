class Sprite {

    /**
     * Constructor
     * @param canvas <HTMLCanvasElement>: canvas context
     * @param context <CanvasRenderingContext2D>: canvas context
     * @params resource <string>: selector for image preloaded resource
     * @params width <Number>: image width in pixels
     * @params height <Number>: image height in pixels
     * @params cols [Number]: number of columns in atlas
     * @params rows [Number]: number of rows in atlas
     * @params cell [Number]: grid cell size in pixels instead of providing rows and cols
     * @params scale [Number]: scale image
     */

    constructor(args = {}) {
        this.canvas = args.canvas;
        this.context = args.context;
        this.atlas = {
            width: args.width,
            height: args.height,
            cols: 'cell' in args ? args.width / args.cell : args.cols || 1,
            rows: 'cell' in args ? args.height / args.cell : args.rows || 1,
            cell: 'cell' in args ? args.cell : args.width / args.cols,
            image: document.querySelector(args.resource)
        };
        this.sprite = {
            width: this.atlas.width / this.atlas.cols,
            height: this.atlas.height / this.atlas.rows,
            scaled: {
                factor: args.scale || 1,
                width: (this.atlas.width / this.atlas.cols) * (args.scale || 1),
                height: (this.atlas.height / this.atlas.rows) * (args.scale || 1)
            }
        };
        this.origin = {
            x: (this.canvas.width / 2) - (this.sprite.scaled.width / 2),
            y: (this.canvas.height / 2) - (this.sprite.scaled.height / 2)
        };
    }

    /**
     * Draw sprite 
     * Coordinates 0,0 are recalculated as center of canvas
     * @param x [Number]: x coordinate in pixels
     * @param y [Number]: y coordinate in pixels
     * @param gx [Number]: column number in grid units
     * @param gy [Number]: row number in grid units
     * @param col [Number 0..n]: which atlas column to draw
     * @param row [Number 0..n]: which atlas row to draw
     * @param nr [Number 0..n]: index number instead of row and col
     */

    render(args = {}) {
        const sx = 'col' in args ? this.sprite.width * args.col : 'nr' in args ? this.sprite.width * (args.nr % this.atlas.cols) : 0;
        const sy = 'row' in args ? this.sprite.height * args.row : 'nr' in args ? this.sprite.width * Math.floor(args.nr / this.atlas.cols) : 0;
        const dx = 'x' in args ? args.x + this.origin.x : (args.gx * this.sprite.scaled.width) + this.origin.x;
        const dy = 'y' in args ? args.y + this.origin.y : (args.gy * this.sprite.scaled.height) + this.origin.y;
        this.context.drawImage(
            this.atlas.image,
            sx,
            sy,
            this.sprite.width,
            this.sprite.height,
            dx,
            dy,
            this.sprite.scaled.width,
            this.sprite.scaled.height
        );
    }

    /**
     * Draw array of sprites
     * @param sprites <array>: [[gx, gy, col, row], ...] or [[gx, gy, nr], ...]
     */

    renderAll(sprites) {
        sprites.forEach(sprite => {
            if (sprite.length == 3) this.render({gx: sprite[0], gy: sprite[1], nr: sprite[2]});
            else this.render({gx: sprite[0], gy: sprite[1], col: sprite[2], row: sprite[3]});
        });
    }

    /**
     * Draw rectangular area of packed sprites info
     * @param gx <Number>: left column of area to start
     * @param gy <Number>: top row of area to start
     * @param sprites <array>: [[nr, nr, ...], ...]
     */

    renderArea(gx, gy, sprites) {
        let x = gx;
        let y = gy;
        sprites.forEach(line => {
            line.forEach(nr => {
                if (nr != null) {
                    this.render({gx: x, gy: y, nr});
                }
                x += 1;
            });
            x = gx;
            y += 1;
        });
    }

}

export default Sprite;
