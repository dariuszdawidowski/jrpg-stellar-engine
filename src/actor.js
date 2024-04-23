/**
 * Actor - sprite with collision checking, animation and movement
 */

class Actor extends Sprite {

    /**
     * Create sprite
     * All Sprite params plus:
     * @param speed: Number - movement speed (pixels on second)
     * @param anim: Object - map of animations { speed: seconds, idle: [], moveUp: [], moveDown: [], moveLeft: [], moveRight: [] }
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

        // Single idle
        if ('idle' in this.anim) {
            this.frame = this.anim.idle[0];
        }

        // Directional idle left
        else if (('idleLeft' in this.anim) && this.transform.h == 'w') {
            this.frame = this.anim.idleLeft[0];
        }

        // Directional idle right
        else if (('idleRight' in this.anim) && this.transform.h == 'e') {
            this.frame = this.anim.idleRight[0];
        }

        // Directional idle top
        else if (('idleUp' in this.anim) && this.transform.v == 'n') {
            this.frame = this.anim.idleUp[0];
        }

        // Directional idle bottom
        else if (('idleDown' in this.anim) && (this.transform.v == 's' || this.transform.v == '')) {
            this.frame = this.anim.idleDown[0];
        }

        this.transform.v = '';
        this.transform.h = '';
    }

    /**
     * Idle animation
     */

    animIdle(deltaTime) {
        // Anim
        this.frameTimeV -= deltaTime;
        if (this.frameTimeV <= 0) {
            this.frameTimeV = this.anim.speed - this.frameTimeV;
            this.frameCounterV ++;
            if (this.frameCounterV == this.anim.idle.length) this.frameCounterV = 0;
        }
        this.frame = this.anim.idle[this.frameCounterV];
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
            if (my.right + pixels > other.left && my.right + pixels < other.right && my.top <= other.bottom && my.bottom >= other.top) {
                return [0, -1.0 * other.angle * 0.01 * pixels];
            }
        }

        // None
        return [0, 0];
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
                return [0, other.angle * 0.01 * pixels];
            }
        }

        // None
        return [0, 0];
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

        // Horizontal action
        this.transform.h = 'w';

        // Move
        this.transform.x -= pixels;
    }

    /**
     * Generic collision checking
     * @param args.view View object - view context
     * @param args.with: [Array] - collision array [{left: Number, top: Number, right: Number, bottom: Number}, ...]
     */

    collideWith(args) {

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
     * Render sprite
     */

    render(view) {
        super.position(this.transform.x, this.transform.y);
        super.cell(this.frame);
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
