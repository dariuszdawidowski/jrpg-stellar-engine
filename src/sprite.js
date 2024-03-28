class Sprite extends TileSet {

    /**
     * Create sprite
     * All TileSet params plus:
     * @param speed: Number - movement speed (pixels on second)
     * @param anim: Object - map of animations { speed: seconds, idle: [], moveUp: [], moveDown: [], moveLeft: [], moveRight: [] }
     * @param collider: {x, y, width, height}
     */

    constructor(args) {
        super(args);

        // Stats
        this.stats = {
            speed: args.speed,
        };

        /**
         * Position in space
         * v: vertical action (n=north,s=south)
         * h: horizontal action (w=west,e=east)
         * x,y: screen
         */
        this.transform = {
            v: '',
            h: '',
            x: 0,
            y: 0,
            // wx: 0,
            // wy: 0,
        };

        // Collider
        this.collider = 'collider' in args ? args.collider : null;

        // Animation map
        this.anim = 'anim' in args ? args.anim : { speed: 0, idle: [], moveUp: [], moveDown: [], moveLeft: [], moveRight: [] };
        this.anim.speed = this.anim.speed / 100.0;

        // Current frame
        this.frame = 0;

        // Current frame counter (horizontal movement)
        this.frameCounterH = 0;

        // Time of the last animation frame (horizontal movement)
        this.frameTimeH = this.anim.speed;

        // Current frame counter (vertical movement)
        this.frameCounterV = 0;

        // Time of the last animation frame (vertical movement)
        this.frameTimeV = this.anim.speed;
    }

    /**
     * Idle movement
     */

    idle() {
        this.frame = this.anim.idle[0];
        this.transform.v = '';
        this.transform.h = '';
    }

    /**
     * Up collision checking
     * @param args.deltaTime Number - time passed since last frame
     * @param args.left: Number - left corner of collision layer
     * @param args.top: Number - top corner of collision layer
     * @param args.tiles: [Array] - collision tiles layer
     * @param args.edge: Number - single tile edge size (square)
     */

    collideUp(args) {

        // Move by pixels
        let pixels = this.stats.speed * args.deltaTime;

        // My collider
        const my = {
            left: this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x,
            top: this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y,
            right: this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x + this.collider.width,
            bottom: this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y + this.collider.height
        };

        // Check intersection with all tiles
        let x = args.left;
        let y = args.top;
        for (const line of args.tiles) {
            for (const nr of line) {
                if (nr != null && nr > -1) {
                    // Tile collider
                    const other = { left: x, top: y, right: x + args.edge, bottom: y + args.edge };
                    // Up side
                    if (my.top - pixels <= other.bottom && my.top - pixels >= other.top && my.right >= other.left && my.left <= other.right) {
                        const crossUp = my.top + other.bottom;
                        pixels -= crossUp;
                        if (pixels < 0) pixels = 0;
                        return pixels;
                    }
                }
                x += args.edge;
            }
            x = args.left;
            y += args.edge;
        }

        return pixels;
    }

    /**
     * Animate to the up side
     * @param deltaTime Number - time passed since last frame
     */

    animUp(deltaTime) {
        // Anim
        this.frameTimeV -= deltaTime;
        if (this.frameTimeV <= 0) {
            this.frameTimeV = this.anim.speed - this.frameTimeV;
            this.frameCounterV ++;
            if (this.frameCounterV == this.anim.moveUp.length) this.frameCounterV = 0;
        }
        this.frame = this.anim.moveUp[this.frameCounterV];
    }

    /**
     * Transfrom to the up side
     * @param pixels Number - how many pixels to move (constant or calculated by collideUp)
     */

    moveUp(pixels) {
        this.transform.y -= pixels;
    }

    /*moveUp(deltaTime) {

        // Anim
        this.frameTimeV -= deltaTime;
        if (this.frameTimeV <= 0) {
            this.frameTimeV = this.anim.speed - this.frameTimeV;
            this.frameCounterV ++;
            if (this.frameCounterV == this.anim.moveUp.length) this.frameCounterV = 0;
        }
        this.frame = this.anim.moveUp[this.frameCounterV];

        // Vertical action
        this.transform.v = 'n';

        // Move
        const pixels = this.stats.speed * deltaTime;
        this.transform.y -= pixels;
        return pixels;
    }*/

    /**
     * Down movement
     */

    /**
     * Down collision checking
     * @param args.deltaTime Number - time passed since last frame
     * @param args.left: Number - left corner of collision layer
     * @param args.top: Number - top corner of collision layer
     * @param args.tiles: [Array] - collision tiles layer
     * @param args.edge: Number - single tile edge size (square)
     */

    collideDown(args) {

        // Move by pixels
        let pixels = this.stats.speed * args.deltaTime;

        // My collider
        const my = {
            left: this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x,
            top: this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y,
            right: this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x + this.collider.width,
            bottom: this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y + this.collider.height
        };

        // Check intersection with all tiles
        let x = args.left;
        let y = args.top;
        for (const line of args.tiles) {
            for (const nr of line) {
                if (nr != null && nr > -1) {
                    // Tile collider
                    const other = { left: x, top: y, right: x + args.edge, bottom: y + args.edge };
                    // Down side
                    if (my.bottom + pixels >= other.top && my.bottom + pixels <= other.bottom && my.right >= other.left && my.left <= other.right) {
                        const crossDown = my.top + other.bottom;
                        pixels -= crossDown;
                        if (pixels < 0) pixels = 0;
                        return pixels;
                    }
                }
                x += args.edge;
            }
            x = args.left;
            y += args.edge;
        }

        return pixels;
    }

    /**
     * Animate to the up side
     * @param deltaTime Number - time passed since last frame
     */

    animDown(deltaTime) {
        // Anim
        this.frameTimeV -= deltaTime;
        if (this.frameTimeV <= 0) {
            this.frameTimeV = this.anim.speed - this.frameTimeV;
            this.frameCounterV ++;
            if (this.frameCounterV == this.anim.moveDown.length) this.frameCounterV = 0;
        }
        this.frame = this.anim.moveDown[this.frameCounterV];
    }

    /**
     * Transfrom to the down side
     * @param pixels Number - how many pixels to move (constant or calculated by collideDown)
     */

    moveDown(pixels) {
        this.transform.y += pixels;
    }

    /**
     * Up movement
     */

    /*moveDown(deltaTime) {

        // Anim
        this.frameTimeV -= deltaTime;
        if (this.frameTimeV <= 0) {
            this.frameTimeV = this.anim.speed - this.frameTimeV;
            this.frameCounterV ++;
            if (this.frameCounterV == this.anim.moveDown.length) this.frameCounterV = 0;
        }
        this.frame = this.anim.moveDown[this.frameCounterV];

        // Vertical action
        this.transform.v = 's';

        // Move
        const pixels = this.stats.speed * deltaTime;
        this.transform.y += pixels;
        return pixels;
    }*/

    /**
     * Right collision checking
     * @param args.deltaTime Number - time passed since last frame
     * @param args.left: Number - left corner of collision layer
     * @param args.top: Number - top corner of collision layer
     * @param args.tiles: [Array] - collision tiles layer
     * @param args.edge: Number - single tile edge size (square)
     */

    collideRight(args) {

        // Move by pixels
        let pixels = this.stats.speed * args.deltaTime;

        // My collider
        const my = {
            left: this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x,
            top: this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y,
            right: this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x + this.collider.width,
            bottom: this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y + this.collider.height
        };

        // Check intersection with all tiles
        let x = args.left;
        let y = args.top;
        for (const line of args.tiles) {
            for (const nr of line) {
                if (nr != null && nr > -1) {
                    // Tile collider
                    const other = { left: x, top: y, right: x + args.edge, bottom: y + args.edge };
                    // Right side
                    if (my.right + pixels >= other.left && my.right + pixels <= other.right && my.top <= other.bottom && my.bottom >= other.top) {
                        const crossRight = my.right - other.left;
                        pixels -= crossRight;
                        if (pixels < 0) pixels = 0;
                        return pixels;
                    }
                }
                x += args.edge;
            }
            x = args.left;
            y += args.edge;
        }

        return pixels;
    }

    /**
     * Animate to the right side
     * @param deltaTime Number - time passed since last frame
     */

    animRight(deltaTime) {
        // Anim
        this.frameTimeH -= deltaTime;
        if (this.frameTimeH <= 0) {
            this.frameTimeH = this.anim.speed - this.frameTimeH;
            this.frameCounterH ++;
            if (this.frameCounterH == this.anim.moveRight.length) this.frameCounterH = 0;
        }
        this.frame = this.anim.moveRight[this.frameCounterH];
    }

    /**
     * Transfrom to the right side
     * @param pixels Number - how many pixels to move (constant or calculated by collideRight)
     */

    moveRight(pixels) {
        this.transform.x += pixels;
    }

    /**
     * Right movement
     */

    /*moveRight(deltaTime) {

        // Anim
        this.frameTimeH -= deltaTime;
        if (this.frameTimeH <= 0) {
            this.frameTimeH = this.anim.speed - this.frameTimeH;
            this.frameCounterH ++;
            if (this.frameCounterH == this.anim.moveRight.length) this.frameCounterH = 0;
        }
        this.frame = this.anim.moveRight[this.frameCounterH];

        // Horizontal action
        this.transform.h = 'e';

        // Move
        const pixels = this.stats.speed * deltaTime
        this.transform.x += pixels;
        return pixels;
    }*/

    /**
     * Left collision checking
     * @param args.deltaTime Number - time passed since last frame
     * @param args.left: Number - left corner of collision layer
     * @param args.top: Number - top corner of collision layer
     * @param args.tiles: [Array] - collision tiles layer
     * @param args.edge: Number - single tile edge size (square)
     */

    collideLeft(args) {

        // Move by pixels
        let pixels = this.stats.speed * args.deltaTime;

        // My collider
        const my = {
            left: this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x,
            top: this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y,
            right: this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x + this.collider.width,
            bottom: this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y + this.collider.height
        };

        // Check intersection with all tiles
        let x = args.left;
        let y = args.top;
        for (const line of args.tiles) {
            for (const nr of line) {
                if (nr != null && nr > -1) {
                    // Tile collider
                    const other = { left: x, top: y, right: x + args.edge, bottom: y + args.edge };
                    // Left side
                    if (my.left - pixels <= other.right && my.left - pixels >= other.left && my.top <= other.bottom && my.bottom >= other.top) {
                        const crossLeft = other.right - my.left;
                        pixels -= crossLeft;
                        if (pixels < 0) pixels = 0;
                        return pixels;
                    }
                }
                x += args.edge;
            }
            x = args.left;
            y += args.edge;
        }

        return pixels;
    }

    /**
     * Animate to the left side
     * @param deltaTime Number - time passed since last frame
     */

    animLeft(deltaTime) {
        // Anim
        this.frameTimeH -= deltaTime;
        if (this.frameTimeH <= 0) {
            this.frameTimeH = this.anim.speed - this.frameTimeH;
            this.frameCounterH ++;
            if (this.frameCounterH == this.anim.moveLeft.length) this.frameCounterH = 0;
        }
        this.frame = this.anim.moveLeft[this.frameCounterH];
    }

    /**
     * Transfrom to the left side
     * @param pixels Number - how many pixels to move (constant or calculated by collideLeft)
     */

    moveLeft(pixels) {
        this.transform.x -= pixels;
    }

    /**
     * Calculate collisions
     * @param left: Number - left corner of collision layer
     * @param top: Number - top corner of collision layer
     * @param tiles: [Array] - collision tiles layer
     * @return {top: Number, bottom: Number, left: Number, right: Number} - table od cross secting (how deep my character sink into obstacle)
     */

    /*collide(args) {
        const cross = {top: 0, bottom: 0, left: 0, right: 0};
        let x = args.left;
        let y = args.top;
        const my = {
            left: this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x,
            top: this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y,
            right: this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x + this.collider.width,
            bottom: this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y + this.collider.height
        };
        args.tiles.forEach(line => {
            line.forEach(nr => {
                if (nr != null && nr > -1) {
                    const other = {
                        left: x,
                        top: y,
                        right: x + args.edge,
                        bottom: y + args.edge,
                    };
                    this.context.fillRect(
                        x,
                        y,
                        args.edge,
                        args.edge
                    );
                    // My left-top
                    if (my.left <= other.right && my.left >= other.left && my.top <= other.bottom && my.top >= other.top) {
                        const crossLeft = other.right - my.left;
                        if (cross.left < crossLeft) cross.left = crossLeft;
                        // const crossTop = other.bottom - my.top;
                        // if (cross.top < crossTop) cross.top = crossTop;
                        // console.log('collide', cross)
                    }
                }
                x += args.edge;
            });
            x = args.left;
            y += args.edge;
        });
        return cross;
    }*/

    /**
     * Debug render own collider shape
     */

    debugDrawCollider() {
        this.context.fillStyle = 'rgba(225,0,0,0.5)';
        this.context.fillRect(
            this.transform.x + (window.innerWidth / 2) - (this.tile.scaled.width / 2) + this.collider.x,
            this.transform.y + (window.innerHeight / 2) - (this.tile.scaled.height / 2) + this.collider.y,
            this.collider.width,
            this.collider.height
        );
    }

    /**
     * Render debug colliders against given tiles
     */

    debugDrawColliders(args) {
        let x = args.left;
        let y = args.top;
        this.context.fillStyle = 'rgba(225,0,0,0.5)';
        args.tiles.forEach(line => {
            line.forEach(nr => {
                if (nr != null && nr > -1) {
                    this.context.fillRect(x, y, args.edge, args.edge);
                }
                x += args.edge;
            });
            x = args.left;
            y += args.edge;
        });
    }

    /**
     * Render sprite
     * @attr origin {x: Number, y: Number} - scroll correction
     */

    render(origin = {x: 0, y: 0}) {
        super.renderSingle({x: this.transform.x + origin.x, y: this.transform.y + origin.y, nr: this.frame});
    }

}
