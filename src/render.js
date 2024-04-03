/*** Render context ***/

class Render {

    /**
     * Constructor
     * @param args.canvas: DOM object - Canvas element
     */

    constructor(args) {

        // Canvas and context
        this.canvas = args.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.canvasCenter = {x: 0, y: 0};

        // Resize window
        window.addEventListener('resize', () => {
            this.fitCanvas();
        });
        
        // Fit first time
        this.fitCanvas();
    }

    /**
     * Clear screen
     */

    cls() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Util: round number to nearest even
     * @param number: Number - value to round
     */

    roundToNearestEven(number) {
        let roundedNumber = Math.round(number);
        if (roundedNumber % 2 !== 0) roundedNumber += 1;
        return roundedNumber;
    }

    /**
     * Fit canvas dimensions and settings
     */

    fitCanvas() {
        this.canvas.width = this.roundToNearestEven(window.innerWidth);
        this.canvas.height = this.roundToNearestEven(window.innerHeight);
        this.canvasCenter.x = this.canvas.width / 2;
        this.canvasCenter.y = this.canvas.height / 2;
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
    }

    /**
     * Debug render
     * @param args.center: bool - display 0,0 of the world coordinates
     * @param args.sprite: Sprite object - sprite to display it's bounds
     */

    debug(args) {

        // Draw world coordinates center
        if ('center' in args) {
            this.ctx.fillStyle = 'rgba(0,255,0,0.8)';
            this.ctx.beginPath();
            this.ctx.moveTo(0 + this.canvasCenter.x, 0 + this.canvasCenter.y);
            this.ctx.lineTo(-16 + this.canvasCenter.x, -8 + this.canvasCenter.y);
            this.ctx.lineTo(-16 + this.canvasCenter.x, 8 + this.canvasCenter.y);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(0 + this.canvasCenter.x, 0 + this.canvasCenter.y);
            this.ctx.lineTo(16 + this.canvasCenter.x, -8 + this.canvasCenter.y);
            this.ctx.lineTo(16 + this.canvasCenter.x, 8 + this.canvasCenter.y);
            this.ctx.fill();
        }

    }

}
