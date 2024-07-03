/**
 * Actor - sprite with collision checking, animation and movement
 */

class Actor extends Sprite {

    /**
     * Create sprite
     * All Sprite params plus:
     * @param speed: Number - movement speed (pixels on second)
     * @param animations: Object - map of animations { animName: [{frame: nr, duration: ms}, ...], ... }
     * @param collider: {x, y, width, height} (in screen pixels already scaled)
     */

    constructor(args) {
        super(args);

        // Stats
        this.stats = {
            speed: args.speed,
        };

        /**
         * Movement direction
         * v: vertical action (n=north,s=south)
         * h: horizontal action (w=west,e=east)
         */
        this.transform['v'] = '';
        this.transform['h'] = '';

        // Collider
        this.collider = 'collider' in args ? args.collider : {x: 0, y: 0, width: this.tile.scaled.width, height: this.tile.scaled.height};

        // Animation map
        this.animations = 'animations' in args ? args.animations : {};

        // Current animation state
        this.anim = {

            // Animation name
            name: null,

            // Frames list from this.animations
            frames: null,

            // Current frame counter
            index: 0,

            // Current time of the animation frame
            time: 0,

            // Start new anim
            start: function(name, animation) {
                this.name = name;
                this.frames = animation;
                this.index = 0;
                this.time = 0;
            },

            // Play forward a little bit
            advance: function(deltaTime) {
                this.time += deltaTime;
                if (this.time * 1000 >= this.frames[this.index].duration) {
                    this.time = 0;
                    this.index ++;
                    if (this.index == this.frames.length) this.index = 0;
                }
            },

            // Get current tile index
            frame: function() {
                return this.frames ? this.frames[this.index].frame : 0;
            }
        };

    }

    /**
     * Idle movement
     */

    idle() {

        // Single idle
        if ('idle' in this.animations) {
            this.animate('idle');
        }

        // Directional idle left
        else if (('idleLeft' in this.animations) && this.transform.h == 'w') {
            this.animate('idleLeft');
        }

        // Directional idle right
        else if (('idleRight' in this.animations) && this.transform.h == 'e') {
            this.animate('idleRight');
        }

        // Directional idle top
        else if (('idleUp' in this.animations) && this.transform.v == 'n') {
            this.animate('idleUp');
        }

        // Directional idle bottom
        else if (('idleDown' in this.animations) && (this.transform.v == 's' || this.transform.v == '')) {
            this.animate('idleDown');
        }

        this.transform.v = '';
        this.transform.h = '';
    }

    /**
     * Returns world collider
     * @param view: View context
     */

    getCollider(view) {
        return {
            left: this.transform.x - this.tile.scaled.halfWidth + this.collider.x,
            top: this.transform.y - this.tile.scaled.halfHeight + this.collider.y,
            right: this.transform.x - this.tile.scaled.halfWidth + this.collider.x + this.collider.width,
            bottom: this.transform.y - this.tile.scaled.halfHeight + this.collider.y + this.collider.height
        };
    }

    /**
     * Up collision checking
     * @param args.view View object - view context
     * @param args.deltaTime Number - time passed since last frame
     * @param args.with: [Array] - collision array [{left: Number, top: Number, right: Number, bottom: Number}, ...]
     */

    collideUp(args) {

        // Collided
        let collided = 0;

        // Move by pixels
        let pixels = this.stats.speed * args.deltaTime;
        let sidePixels = 0;

        // My collider
        const my = this.getCollider(args.view);

        // Check intersections
        for (const other of args.with) {
            if (my.top - pixels < other.bottom && my.top - pixels > other.top && my.right >= other.left && my.left <= other.right) {

                // Debug info
                if (args.view.debugEnabled) args.view.debugBox.push({x: other.left, y: other.top, w: other.right - other.left, h: other.bottom - other.top});

                // Slide right
                if (my.right > other.right) {
                    sidePixels = this.stats.speed * 0.7 * args.deltaTime;
                    collided ++;
                }

                // Slide left
                else if (my.left < other.left) {
                    sidePixels = -(this.stats.speed * 0.7 * args.deltaTime);
                    collided ++;
                }

                // No slide
                else {
                    sidePixels = 0;
                    collided ++;
                }
            }
        }

        return [collided > 1 ? 0 : sidePixels, collided > 0 ? 0 : pixels];
    }

    /**
     * Update animation
     * @param deltaTime Number - time passed since last frame
     */

    animate(name, deltaTime = 0) {
        if (this.anim.name != name) this.anim.start(name, this.animations[name]);
        this.anim.advance(deltaTime);
    }

    /**
     * Transfrom to the up side
     * @param pixels Number - how many pixels to move (constant or calculated by collideUp)
     */

    moveUp(pixels) {

        // Vertical action
        this.transform.v = 'n';

        // Move
        this.transform.y -= pixels;
    }

    /**
     * Down movement
     */

    /**
     * Down collision checking
     * @param args.view View object - view context
     * @param args.deltaTime Number - time passed since last frame
     * @param args.with: [Array] - collision array [{left: Number, top: Number, right: Number, bottom: Number}, ...]
     */

    collideDown(args) {

        // Collided
        let collided = 0;

        // Move by pixels
        let pixels = this.stats.speed * args.deltaTime;
        let sidePixels = 0;

        // My collider
        const my = this.getCollider(args.view);

        // Check intersections
        for (const other of args.with) {
            if (my.bottom + pixels > other.top && my.bottom + pixels < other.bottom && my.right >= other.left && my.left <= other.right) {

                // Debug info
                if (args.view.debugEnabled) args.view.debugBox.push({x: other.left, y: other.top, w: other.right - other.left, h: other.bottom - other.top});

                // Slide to right
                if (my.right > other.right) {
                    sidePixels = this.stats.speed * 0.7 * args.deltaTime;
                    collided ++;
                }

                // Slide to left
                else if (my.left < other.left) {
                    sidePixels = -(this.stats.speed * 0.7 * args.deltaTime);
                    collided ++;
                }

                // No slide
                else {
                    sidePixels = 0;
                    collided ++;
                }
            }
        }

        return [collided > 1 ? 0 : sidePixels, collided > 0 ? 0 : pixels];
    }

    /**
     * Transfrom to the down side
     * @param pixels Number - how many pixels to move (constant or calculated by collideDown)
     */

    moveDown(pixels) {

        // Vertical action
        this.transform.v = 's';

        // Move
        this.transform.y += pixels;
    }

    /**
     * Right collision checking
     * @param args.view View object - view context
     * @param args.deltaTime Number - time passed since last frame
     * @param args.with: [Array] - collision array [{left: Number, top: Number, right: Number, bottom: Number}, ...]
     */

    collideRight(args) {

        // Collided
        let collided = 0;

        // Move by pixels
        let pixels = this.stats.speed * args.deltaTime;
        let sidePixels = 0;

        // My collider
        const my = this.getCollider(args.view);

        // Check intersections
        for (const other of args.with) {
            if (my.right + pixels > other.left && my.right + pixels < other.right && my.top <= other.bottom && my.bottom >= other.top) {

                // Debug info
                if (args.view.debugEnabled) args.view.debugBox.push({x: other.left, y: other.top, w: other.right - other.left, h: other.bottom - other.top});

                // Slide to up
                if (my.top < other.top) {
                    sidePixels = -(this.stats.speed * 0.7 * args.deltaTime);
                    collided ++;
                }

                // Slide to down
                else if (my.bottom > other.bottom) {
                    sidePixels = this.stats.speed * 0.7 * args.deltaTime;
                    collided ++;
                }

                // No slide
                else {
                    sidePixels = 0;
                    collided ++;
                }
            }
        }

        return [collided > 0 ? 0 : pixels, collided > 1 ? 0 : sidePixels];
    }

    /**
     * Right stairs/slope checking
     * @param args.view View object - view context
     * @param args.deltaTime Number - time passed since last frame
     * @param args.with: [Array] - collision array [{left: Number, top: Number, right: Number, bottom: Number}, ...]
     */

    stairsRight(args) {

        // Move by pixels
        const pixels = this.stats.speed * args.deltaTime;

        // My collider
        const my = this.getCollider(args.view);

        // Check intersections
        for (const other of args.with) {
            if (my.right - (this.collider.width / 2) + pixels > other.left && my.right - (this.collider.width / 2) + pixels < other.right && my.top <= other.bottom && my.bottom >= other.top) {
                return [0, other.angle > 0 ? -(pixels * 0.7) : (pixels * 0.7)];
            }
        }

        // None
        return [0, 0];
    }

    /**
     * Transfrom to the right side
     * @param pixels Number - how many pixels to move (constant or calculated by collideRight)
     */

    moveRight(pixels) {

        // Horizontal action
        this.transform.h = 'e';

        // Move
        this.transform.x += pixels;
    }

    /**
     * Left collision checking
     * @param args.view View object - view context
     * @param args.deltaTime Number - time passed since last frame
     * @param args.with: [Array] - collision array [{left: Number, top: Number, right: Number, bottom: Number}, ...]
     */

    collideLeft(args) {

        // Collided
        let collided = 0;

        // Move by pixels
        let pixels = this.stats.speed * args.deltaTime;
        let sidePixels = 0;

        // My collider
        const my = this.getCollider(args.view);

        // Check intersections
        for (const other of args.with) {
            if (my.left - pixels < other.right && my.left - pixels > other.left && my.top <= other.bottom && my.bottom >= other.top) {

                // Debug info
                if (args.view.debugEnabled) args.view.debugBox.push({x: other.left, y: other.top, w: other.right - other.left, h: other.bottom - other.top});

                // Slide to up
                if (my.top < other.top) {
                    sidePixels = -(this.stats.speed * 0.7 * args.deltaTime);
                    collided ++;
                }

                // Slide to down
                else if (my.bottom > other.bottom) {
                    sidePixels = this.stats.speed * 0.7 * args.deltaTime;
                    collided ++;
                }

                // No slide
                else {
                    sidePixels = 0;
                    collided ++;
                }
            }
        }

        return [collided > 0 ? 0 : pixels, collided > 1 ? 0 : sidePixels];
    }

    /**
     * Left stairs/slope checking
     * @param args.view View object - view context
     * @param args.deltaTime Number - time passed since last frame
     * @param args.with: [Array] - collision array [{left: Number, top: Number, right: Number, bottom: Number}, ...]
     */

    stairsLeft(args) {
        // Move by pixels
        const pixels = this.stats.speed * args.deltaTime;

        // My collider
        const my = this.getCollider(args.view);

        // Check intersections
        for (const other of args.with) {
            if (my.left - pixels < other.right && my.left - pixels > other.left && my.top <= other.bottom && my.bottom >= other.top) {
                return [0, other.angle < 0 ? -(pixels * 0.7) : (pixels * 0.7)];
            }
        }

        // None
        return [0, 0];
    }

    /**
     * Transfrom to the left side
     * @param pixels Number - how many pixels to move (constant or calculated by collideLeft)
     */

    moveLeft(pixels) {

        // Horizontal action
        this.transform.h = 'w';

        // Move
        this.transform.x -= pixels;
    }

    /**
     * Collision checking with other sprite
     * @param args.view View object - view context
     * @param args.with: Sprite object - other
     */

    collideWithSprite(args) {

        // My collider
        const my = this.getCollider(args.view);

        // That collider
        const that = args.with.getCollider(args.view);

        // Check crossections for all corners
        // Left-top
        if (my.left > that.left && my.left < that.right && my.top > that.top && my.top < that.bottom) return true;
        // Right-top
        else if (my.right > that.left && my.right < that.right && my.top > that.top && my.top < that.bottom) return true;
        // Left-bottom
        else if (my.left > that.left && my.left < that.right && my.bottom > that.top && my.bottom < that.bottom) return true;
        // Right-bottom
        else if (my.right > that.left && my.right < that.right && my.bottom > that.top && my.bottom < that.bottom) return true;

        return false;
    }

    /**
     * Generic collision checking
     * @param args.view View object - view context
     * @param args.with: object - collision {left: Number, top: Number, right: Number, bottom: Number}
     */

    collideWithBox(args) {

        // My collider
        const my = this.getCollider(args.view);

        // Check crossections for all corners
        // Left-top
        if (my.left > args.with.left && my.left < args.with.right && my.top > args.with.top && my.top < args.with.bottom) return true;
        // Right-top
        else if (my.right > args.with.left && my.right < args.with.right && my.top > args.with.top && my.top < args.with.bottom) return true;
        // Left-bottom
        else if (my.left > args.with.left && my.left < args.with.right && my.bottom > args.with.top && my.bottom < args.with.bottom) return true;
        // Right-bottom
        else if (my.right > args.with.left && my.right < args.with.right && my.bottom > args.with.top && my.bottom < args.with.bottom) return true;

        return false;
    }

    /**
     * Render sprite
     */

    render(view) {
        super.position(this.transform.x, this.transform.y);
        super.cell(this.anim.frame());
        super.render(view);
    }

    /**
     * Debug render
     * @param view: View context
     */

    debug(view) {
        view.ctx.fillStyle = 'rgba(225,225,0,0.5)';
        const my = this.getCollider(view);
        view.ctx.fillRect(
            my.left + view.center.x + view.offset.x,
            my.top + view.center.y + view.offset.y,
            (my.right + view.center.x + view.offset.x) - (my.left + view.center.x + view.offset.x),
            (my.bottom + view.center.y + view.offset.y) - (my.top + view.center.y + view.offset.y)
        );
    }

}
