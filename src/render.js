class Render {

    /**
     * Constructor
     * @param args.canvas: DOM object - Canvas element
     */

    constructor(args) {

        this.canvas = args.canvas;
        this.context = this.canvas.getContext('2d');

    }

    /**
     * Render
     */

    draw(deltaTime) {
    }

}
