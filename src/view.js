/**
 * View context
 */

class View {

    /**
     * Constructor
     * @param args.canvas: DOM object - Canvas element
     * @param args.debug: bool - Debug enabled
     */

    constructor(args) {

        // Canvas and context
        this.canvas = args.canvas;
        this.ctx = this.canvas.getContext('2d');

        // Center of the canvas
        this.center = {x: 0, y: 0};

        // Offset for scroll
        this.offset = {x: 0, y: 0};

        // Debug info posted by other classes
        this.debugEnabled = 'debug' in args ? args.debug : false;
        this.debugBox = [];

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
     * Fill background with color
     */

    fill(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Fill with background image
     * @param resource: object - image to display
     * @param position: {x, y} - image offset
     * @param size: {w, h} - image width and height
     * @param repeat: {x, y} - repeat tiles
     * @param parallax: {x, y} - parallax speed
     * @param coordinates: string - 'world' | 'screen' | 'cover'
     */
 
    background(resource, position, size, repeat, parallax, coordinates = 'world') {

        // Compute base x,y with parallax
        let base = {x: 0, y: 0};

        if (coordinates == 'world') {
            base.x = ((position.x + this.center.x + this.offset.x) * parallax.x) % size.w;
            base.y = (position.y + this.center.y + this.offset.y);
        }
        else if (coordinates == 'screen' || coordinates == 'cover') {
            base.x = ((position.x + this.offset.x) * parallax.x) % size.w;
            base.y = ((position.y + this.offset.y) * parallax.y) % size.h;
        }

        // Standard draw
        if (repeat.x == 0 && repeat.y == 0 && (coordinates == 'world' || coordinates == 'screen')) {
            this.ctx.drawImage(resource, base.x, base.y, size.w, size.h);
        }

        // Fit to screen
        if (repeat.x == 0 && repeat.y == 0 && coordinates == 'cover') {
            const transform = this.coverCanvas(size.w, size.h);
            transform[0] = transform[0] + base.x;
            transform[1] = transform[1] + base.y;
            this.ctx.drawImage(resource, ...transform);
        }

        // Repeat X
        else if (repeat.x == 1 && repeat.y == 0) {
            for (let x = base.x - size.w; x < this.canvas.width; x += size.w) {
                this.ctx.drawImage(resource, x, base.y, size.w, size.h);
            }
        }

        // Repeat Y
        else if (repeat.x == 0 && repeat.y == 1) {
            for (let y = base.y - size.h; y < this.canvas.height; y += size.h) {
                this.ctx.drawImage(resource, base.x, y, size.w, size.h);
            }
        }

        // Repeat X,Y
        else if (repeat.x == 1 && repeat.y == 1) {
            for (let y = base.y - size.h; y < this.canvas.height; y += size.h) {
                for (let x = base.x - size.w; x < this.canvas.width; x += size.w) {
                    this.ctx.drawImage(resource, x, y, size.w, size.h);
                }
            }
        }

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
     * Fit canvas dimensions and settings
     */

    fitCanvas() {
        this.canvas.width = roundToNearestEven(window.innerWidth);
        this.canvas.height = roundToNearestEven(window.innerHeight);
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
     * World transform -> screen transform (0,0 in the corner)
     * @param transform: {x, y}
     */

    world2Screen(transform) {
        return {
            x: transform.x + this.center.x + this.offset.x,
            y: transform.y + this.center.y + this.offset.y
        };
    }

    /**
     * Screen transform -> world transform (0,0 in the center)
     * @param transform: {x, y}
     */

    screen2World(transform) {
        return {
            x: transform.x - this.center.x - this.offset.x,
            y: transform.y - this.center.y - this.offset.y
        };
    }

    /**
     * Make a screenshot
     */

    screenshot(download = false) {
        const dataURL = this.canvas.toDataURL('image/png');
        const img = new Image();
        img.src = dataURL;
        if (download) {
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'canvas-screenshot.png';
            link.click();
        }
        return img;
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
        this.ctx.moveTo(...Object.values(this.world2Screen({x: 0, y: 0})));
        this.ctx.lineTo(...Object.values(this.world2Screen({x: -8, y: -16})));
        this.ctx.lineTo(...Object.values(this.world2Screen({x: 8, y: -16})));
        this.ctx.fill();

        // Name
        this.ctx.font = "14px sans-serif";
        const txtc = this.ctx.measureText('0,0').width / 2;
        this.ctx.fillText('0,0', this.center.x + this.offset.x - txtc, this.center.y + this.offset.y + 16);

        // Draw other classes boxes
        this.ctx.fillStyle = 'rgba(255,255,0,0.3)';
        this.debugBox.forEach(box => {
            this.ctx.fillRect(
                box.x + view.center.x + view.offset.x,
                box.y + view.center.y + view.offset.y,
                box.w,
                box.h
            );
        });

        // Clear debug info
        if (this.debugBox.length) this.debugBox = [];

        // Helper dot
        /*this.ctx.beginPath();
        this.ctx.arc(...Object.values(this.world2Screen({x: 961.09, y: 865.10})), 4, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'rgba(0,255,0,0.9)';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(...Object.values(this.world2Screen({x: 1090.37, y: 920.1})), 4, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'rgba(255,0,255,0.9)';
        this.ctx.fill();*/

    }

}
