/**
 * Atlas - base image for sprites
 */

class Atlas {

    /**
     * Constructor
     * @param resource: string - selector for image preloaded resource (this is also id)
     * @param width: Number - image width in pixels
     * @param height: Number - image height in pixels
     * @param cols: Number - number of columns in atlas (optional)
     * @param rows: Number - number of rows in atlas (optional)
     * @param cell: Number - grid cell size in pixels instead of providing rows and cols (optional)
     */

    constructor(args) {
        this.width = args.width;
        this.height = args.height;
        this.cols = 'cell' in args ? args.width / args.cell : args.cols || 1;
        this.rows = 'cell' in args ? args.height / args.cell : args.rows || 1;
        this.cell = 'cell' in args ? args.cell : args.width / args.cols;
        this.image = null;
        this.resource = args.resource;

    }

    async load() {
        // Load image from HTML
        if (typeof(this.resource) == 'string' && this.resource.startsWith('#')) {
            this.image = document.querySelector(this.resource);
        }
        // Load image from URL
        else if (typeof(this.resource) == 'string') {
            this.image = await Cache.getImage(this.resource);
        }
        // Preloaded image
        else if (typeof(this.resource) == 'object') {
            this.image = this.resource;
        }
    }
}
