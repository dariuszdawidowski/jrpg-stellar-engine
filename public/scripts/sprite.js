class Sprite {

    /**
     * Constructor
     * @param canvas <HTMLCanvasElement>: canvas context
     * @param context <CanvasRenderingContext2D>: canvas context
     * @params resource <String>: selector for image preloaded resource
     * @params width <Number>: image width in pixels
     * @params height <Number>: image height in pixels
     * @params cols [Number]: number of columns in atlas
     * @params rows [Number]: number of rows in atlas
     * @params scale [Number]: scale image
     */

    constructor(args = {}) {
        this.canvas = args.canvas;
        this.context = args.context;
        this.atlas = {
            width: args.width,
            height: args.height,
            cols: args.cols || 1,
            rows: args.rows || 1,
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
     * @param x <Number>: x coordinate
     * @param y <Number>: y coordinate
     * @param col [Number 0..n]: which atlas column to draw
     * @param row [Number 0..n]: which atlas row to draw
     */

    render(args = {}) {
        const col = args.col || 0;
        const row = args.row || 0;
        this.context.drawImage(
            this.atlas.image,
            this.sprite.width * col,
            this.sprite.height * row,
            this.sprite.width,
            this.sprite.height,
            args.x + this.origin.x,
            args.y + this.origin.y,
            this.sprite.scaled.width,
            this.sprite.scaled.height
        );
    }

    /**
     * Draw array of sprites
     */

    renderAll(sprites) {
    }

}
