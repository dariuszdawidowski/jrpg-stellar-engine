/**
 * Point for the direct spawning
 */

class SpawnPoint {

    /**
     * Constructor
     */

    constructor(args) {
        this.x = args.x;
        this.y = args.y;
        this.w = ('w' in args) ? args.w : null;
        this.h = ('h' in args) ? args.h : null;
    }
}
