/**
 * View context
 */

class View {

    /**
     * Constructor
     * @param args.canvas: DOM object - Canvas element
     */

    constructor(args) {

        // Canvas and context
        this.canvas = args.canvas;
        this.ctx = this.canvas.getContext('2d');

        // Center of the canvas
        this.center = {x: 0, y: 0};

        // Offset for scroll
        this.offset = {x: 0, y: 0};

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
     * Fill with background image
     */

    background(resource, width, height) {
        this.ctx.drawImage(resource, ...this.coverCanvas(width, height));
    }

    /**
     * Util: calculate image dimensions similiar to background-size: cover
     */

    coverCanvas(imgWidth, imgHeight) {
        const canvasRatio = this.canvas.width / this.canvas.height;
        const imgRatio = imgWidth / imgHeight;
        let width = 0;
        let height = 0;
        let x = 0;
        let y = 0;

        if (canvasRatio > imgRatio) {
            width = this.canvas.width;
            height = this.canvas.width / imgRatio;
            x = 0;
            y = (this.canvas.height - height) / 2;
        } else {
            width = this.canvas.height * imgRatio;
            height = this.canvas.height;
            x = (this.canvas.width - width) / 2;
            y = 0;
        }
        return [x, y, width, height];
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
        this.center.x = this.canvas.width / 2;
        this.center.y = this.canvas.height / 2;
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
    }

    /**
     * Centre screen on given point
     * @param args.x: Number - x coordinate
     * @param args.y: Number - y coordinate
     */

    centre(args) {
        this.offset.x = -args.x;
        this.offset.y = -args.y;
    }

    /**
     * Debug render
     * @param args.center: bool - display 0,0 of the world coordinates
     * @param args.sprite: Sprite object - sprite to display it's bounds
     */

    debug() {

        // Draw world coordinates center
        this.ctx.fillStyle = 'rgba(0,255,0,0.8)';
        this.ctx.beginPath();
        this.ctx.moveTo(0 + this.center.x + this.offset.x, 0 + this.center.y + this.offset.y);
        this.ctx.lineTo(-16 + this.center.x + this.offset.x, -8 + this.center.y + this.offset.y);
        this.ctx.lineTo(-16 + this.center.x + this.offset.x, 8 + this.center.y + this.offset.y);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(0 + this.center.x + this.offset.x, 0 + this.center.y + this.offset.y);
        this.ctx.lineTo(16 + this.center.x + this.offset.x, -8 + this.center.y + this.offset.y);
        this.ctx.lineTo(16 + this.center.x + this.offset.x, 8 + this.center.y + this.offset.y);
        this.ctx.fill();

    }

}
