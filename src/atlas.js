/**
 * Atlas - base image for sprites
 */

class Atlas {

    /**
     * Constructor
     * @param id: string - unique id (optional)
     * @param resource: string - selector for image preloaded resource
     * @param width: Number - image width in pixels
     * @param height: Number - image height in pixels
     * @param cols: Number - number of columns in atlas (optional)
     * @param rows: Number - number of rows in atlas (optional)
     * @param cell: Number - grid cell size in pixels instead of providing rows and cols (optional)
     */

    constructor(args) {
        this.id = ('id' in args) ? args.id : null;
        this.width = args.width;
        this.height = args.height;
        this.cols = 'cell' in args ? args.width / args.cell : args.cols || 1;
        this.rows = 'cell' in args ? args.height / args.cell : args.rows || 1;
        this.cell = 'cell' in args ? args.cell : args.width / args.cols;
        this.image = null;

        // Load image from HTML
        if (typeof(args.resource) == 'string' && args.resource.startsWith('#')) {
            this.image = document.querySelector(args.resource);
        }
        // Load image from URL
        else if (typeof(args.resource) == 'string') {
            this.image = Cache.getImage(args.resource);
        }
        // Preloaded image
        else if (typeof(args.resource) == 'object') {
            this.image = args.resource;
        }

    }
}
