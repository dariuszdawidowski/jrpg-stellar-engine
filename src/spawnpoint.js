/**
 * Point for the direct spawning
 */

class SpawnPoint {

    /**
     * Constructor
     */

    constructor(args) {
        // Transform
        this.x = args.x;
        this.y = args.y;
        this.w = ('w' in args) ? args.w : 0;
        this.h = ('h' in args) ? args.h : 0;
    }
}
