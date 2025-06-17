/**
 * Portal to enter into another Level
 */

class Portal {

    /**
     * Constructor
     */

    constructor(args) {

        // Type
        this.type = args.type || 'portal';

        // Destination level URL
        this.map = args.map;

        // Spawn point name to appear on destination level
        this.spawn = args.spawn;

        // Size
        this.left = args.left;
        this.top = args.top;
        this.right = args.right;
        this.bottom = args.bottom;
    }

}
