class TileSet {

    /**
     * Constructor
     * @param canvas: HTMLCanvasElement - canvas context
     * @param context: CanvasRenderingContext2D - canvas context
     * @params resource: string - selector for image preloaded resource
     * @params width: Number - image width in pixels
     * @params height: Number - image height in pixels
     * @params cols: Number - number of columns in atlas (optional)
     * @params rows: Number - number of rows in atlas (optional)
     * @params cell: Number - grid cell size in pixels instead of providing rows and cols (optional)
     * @params scale: Number - scale image (optional)
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
        this.tile = {
            width: this.atlas.width / this.atlas.cols,
            height: this.atlas.height / this.atlas.rows,
            scaled: {
                factor: args.scale || 1,
                width: (this.atlas.width / this.atlas.cols) * (args.scale || 1),
                height: (this.atlas.height / this.atlas.rows) * (args.scale || 1)
            }
        };
        this.origin = {
            x: (this.canvas.width / 2) - (this.tile.scaled.width / 2),
            y: (this.canvas.height / 2) - (this.tile.scaled.height / 2)
        };
    }

    /**
     * Draw single tile
     * Coordinates 0,0 are recalculated as center of canvas
     * @param x: Number - x coordinate in pixels
     * @param y: Number - y coordinate in pixels
     * @param gx: Number - column number in grid units
     * @param gy: Number - row number in grid units
     * @param col: Number 0..n - which atlas column to draw
     * @param row: Number 0..n - which atlas row to draw
     * @param nr: Number 0..n - index number instead of row and col
     */

    renderSingle(args = {}) {
        const sx = 'col' in args ? this.tile.width * args.col : 'nr' in args ? this.tile.width * (args.nr % this.atlas.cols) : 0;
        const sy = 'row' in args ? this.tile.height * args.row : 'nr' in args ? this.tile.height * Math.floor(args.nr / this.atlas.cols) : 0;
        const dx = 'x' in args ? args.x + this.origin.x : (args.gx * this.tile.scaled.width) + this.origin.x;
        const dy = 'y' in args ? args.y + this.origin.y : (args.gy * this.tile.scaled.height) + this.origin.y;
        this.context.drawImage(
            this.atlas.image,
            sx,
            sy,
            this.tile.width,
            this.tile.height,
            dx,
            dy,
            this.tile.scaled.width,
            this.tile.scaled.height
        );
    }

    /**
     * Draw array of tiles
     * @param x: Number - x coordinate of top left corner
     * @param y: Number - y coordinate of top left corner
     * @param tiles: array [[nr, nr, ...], ...]
     */

    renderList(args = {}) {
        let x = args.x;
        let y = args.y;
        args.tiles.forEach(line => {
            line.forEach(nr => {
                if (nr != null) this.renderSingle({x, y, nr});
                x += this.tile.scaled.width;
            });
            x = args.x;
            y += this.tile.scaled.height;
        });
    }

}
