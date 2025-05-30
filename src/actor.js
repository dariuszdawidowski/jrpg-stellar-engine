/**
 * Actor - sprite with collision checking, animation and movement
 */

class Actor extends AnimSprite {

    /**
     * Create sprite
     * All AnimSprite params plus:
     * @param properties: {} - custom properties
     * @param properties.spd: Number - movement speed (pixels on second)
     * @param collider: {x, y, width, height} (in screen pixels already scaled)
     */

    constructor(args) {
        super(args);

        // Type
        this.type = args.type || 'actor';

        // References
        this.level = null;
        this.view = null;

        // Properties
        this.properties = { ...args.properties };

        // Diagonal nomalizer ~0.7071
        this.diagonalNormalizer = 1 / Math.sqrt(2);

        /**
         * Movement direction
         * v: vertical action (n=north,s=south)
         * h: horizontal action (w=west,e=east)
         */
        this.transform['v'] = '';
        this.transform['h'] = '';

        // Collider
        this.collider = 'collider' in args ? args.collider : {x: 0, y: 0, width: this.tile.scaled.width, height: this.tile.scaled.height};

        // Origin in the center of the collider
        this.origin.x = this.collider.x + (this.collider.width / 2);
        this.origin.y = this.collider.y + (this.collider.height / 2);
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

    getCollider() {
        return {
            left: this.transform.x - this.origin.x + this.collider.x,
            top: this.transform.y - this.origin.y + this.collider.y,
            right: this.transform.x - this.origin.x + this.collider.x + this.collider.width,
            bottom: this.transform.y - this.origin.y + this.collider.y + this.collider.height
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
        let pixels = this.properties.spd * args.deltaTime;
        let sidePixels = 0;

        // My collider
        const my = this.getCollider();

        // Check intersections
        for (const other of args.with) {
            if (my.top - pixels < other.bottom && my.top - pixels > other.top && my.right >= other.left && my.left <= other.right) {

                // Debug info
                if (args.view.debugEnabled) args.view.debugBox.push({x: other.left, y: other.top, w: other.right - other.left, h: other.bottom - other.top});

                // Slide right
                if (my.right > other.right) {
                    sidePixels = this.properties.spd * this.diagonalNormalizer * args.deltaTime;
                    collided ++;
                }

                // Slide left
                else if (my.left < other.left) {
                    sidePixels = -(this.properties.spd * this.diagonalNormalizer * args.deltaTime);
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
     * Transform to the up side
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
        let pixels = this.properties.spd * args.deltaTime;
        let sidePixels = 0;

        // My collider
        const my = this.getCollider();

        // Check intersections
        for (const other of args.with) {
            if (my.bottom + pixels > other.top && my.bottom + pixels < other.bottom && my.right >= other.left && my.left <= other.right) {

                // Debug info
                if (args.view.debugEnabled) args.view.debugBox.push({x: other.left, y: other.top, w: other.right - other.left, h: other.bottom - other.top});

                // Slide to right
                if (my.right > other.right) {
                    sidePixels = this.properties.spd * this.diagonalNormalizer * args.deltaTime;
                    collided ++;
                }

                // Slide to left
                else if (my.left < other.left) {
                    sidePixels = -(this.properties.spd * this.diagonalNormalizer * args.deltaTime);
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
     * Transform to the down side
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
        let pixels = this.properties.spd * args.deltaTime;
        let sidePixels = 0;

        // My collider
        const my = this.getCollider();

        // Check intersections
        for (const other of args.with) {
            if (my.right + pixels > other.left && my.right + pixels < other.right && my.top <= other.bottom && my.bottom >= other.top) {

                // Debug info
                if (args.view.debugEnabled) args.view.debugBox.push({x: other.left, y: other.top, w: other.right - other.left, h: other.bottom - other.top});

                // Slide to up
                if (my.top < other.top) {
                    sidePixels = -(this.properties.spd * this.diagonalNormalizer * args.deltaTime);
                    collided ++;
                }

                // Slide to down
                else if (my.bottom > other.bottom) {
                    sidePixels = this.properties.spd * this.diagonalNormalizer * args.deltaTime;
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
     * Right stairs/slope checking with smoother angle-based movement
     * @param args.view View object - view context
     * @param args.deltaTime Number - time passed since last frame
     * @param args.with: [Stairs, ...] - collision array
     */

    stairsRight(args) {
        // Move by pixels
        const pixels = this.properties.spd * args.deltaTime;

        // My collider
        const my = this.getCollider();
        
        // Calculate current actor center point
        const actorCenterX = (my.left + my.right) / 2;
        const actorFeetY = my.bottom;
        
        // Calculate PREDICTED actor center point (after moving right)
        const predictedCenterX = actorCenterX + pixels;

        // Define a maximum reasonable angle for stairs for calculation purposes
        const MAX_CALCULATION_ANGLE_RAD = Math.PI / 6;

        // Check intersections
        for (const other of args.with) {
            // Check if predicted center position will be on stairs
            if (predictedCenterX > other.left && 
                predictedCenterX < other.right && 
                actorFeetY > other.top && 
                actorFeetY < other.bottom) {
                
                // Clamp the actual stair angle to our defined maximum for calculation
                const clampedAngle = Math.max(-MAX_CALCULATION_ANGLE_RAD, Math.min(MAX_CALCULATION_ANGLE_RAD, other.angle));
                
                // Calculate vertical adjustment using tangent of the CLAMPED angle
                const verticalAdjustment = Math.tan(clampedAngle) * pixels;
                
                // Attraction to stairs center
                const stairsCenterY = (other.top + other.bottom) / 2;
                const centerOffset = stairsCenterY - actorFeetY;
                const attractionStrength = 0.8;
                const centerCorrection = centerOffset * attractionStrength * args.deltaTime;

                return [0, -verticalAdjustment + centerCorrection];
            }
        }
        
        return [0, 0];
    }

    /**
     * Transform to the right side
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
        let pixels = this.properties.spd * args.deltaTime;
        let sidePixels = 0;

        // My collider
        const my = this.getCollider();

        // Check intersections
        for (const other of args.with) {
            if (my.left - pixels < other.right && my.left - pixels > other.left && my.top <= other.bottom && my.bottom >= other.top) {

                // Debug info
                if (args.view.debugEnabled) args.view.debugBox.push({x: other.left, y: other.top, w: other.right - other.left, h: other.bottom - other.top});

                // Slide to up
                if (my.top < other.top) {
                    sidePixels = -(this.properties.spd * this.diagonalNormalizer * args.deltaTime);
                    collided ++;
                }

                // Slide to down
                else if (my.bottom > other.bottom) {
                    sidePixels = this.properties.spd * this.diagonalNormalizer * args.deltaTime;
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
     * @param args.with: [Stairs, ...] - collision array
     */

    stairsLeft(args) {
        // Move by pixels
        const pixels = this.properties.spd * args.deltaTime;

        // My collider
        const my = this.getCollider();

        // Calculate current actor center point
        const actorCenterX = (my.left + my.right) / 2;
        const actorFeetY = my.bottom;

        // Calculate PREDICTED actor center point (after moving left)
        const predictedCenterX = actorCenterX - pixels;

        // Define a maximum reasonable angle for stairs for calculation purposes
        const MAX_CALCULATION_ANGLE_RAD = Math.PI / 6; 

        // Check intersections
        for (const other of args.with) {
            // Check if predicted center position will be on stairs
            if (
                predictedCenterX < other.right &&
                predictedCenterX > other.left &&
                actorFeetY > other.top &&
                actorFeetY < other.bottom
            ) {
                // Clamp the actual stair angle to our defined maximum for calculation
                const clampedAngle = Math.max(-MAX_CALCULATION_ANGLE_RAD, Math.min(MAX_CALCULATION_ANGLE_RAD, other.angle));
                
                // Calculate vertical adjustment using tangent of the CLAMPED angle
                const verticalAdjustment = Math.tan(clampedAngle) * pixels;

                // Attraction to stairs center
                const stairsCenterY = (other.top + other.bottom) / 2;
                const centerOffset = stairsCenterY - actorFeetY;
                const attractionStrength = 0.8;
                const centerCorrection = centerOffset * attractionStrength * args.deltaTime;

                return [0, verticalAdjustment + centerCorrection];
            }
        }
        
        return [0, 0];
    }

    /**
     * Transform to the left side
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
        const my = this.getCollider();

        // That collider
        const that = args.with.getCollider();

        // Check for AABB overlap
        return rectIntersect(my, that);
    }

    /**
     * Generic collision checking
     * @param args.view View object - view context
     * @param args.with: object - collision {left: Number, top: Number, right: Number, bottom: Number}
     */

    collideWithBox(args) {

        // My collider
        const my = this.getCollider();

        // Check for AABB overlap
        return rectIntersect(my, args.with);
    }

    /**
     * Update actor
     */

    update() {
        /*** Overload ***/
    }

    /**
     * Render Actor
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

        // Collider
        view.ctx.fillStyle = 'rgba(225,225,0,0.5)';
        const my = this.getCollider();
        view.ctx.fillRect(
            my.left + view.center.x + view.offset.x,
            my.top + view.center.y + view.offset.y,
            (my.right + view.center.x + view.offset.x) - (my.left + view.center.x + view.offset.x),
            (my.bottom + view.center.y + view.offset.y) - (my.top + view.center.y + view.offset.y)
        );

        // Origin
        view.ctx.fillStyle = 'rgba(231, 112, 0, 0.9)';
        view.ctx.beginPath();
        const center = view.world2Screen(this.transform);
        view.ctx.arc(
            center.x,
            center.y,
            3, 0, Math.PI * 2
        );
        view.ctx.fill();
    }

    /**
     * Serialize to clean object compatible with ACX
     * 
        'className': 'MOB',
        'name': 'mob',
        'resource': '/sprites/mob.png',
        'width': 256,
        'height': 16,
        'cols': 16,
        'rows': 1,
        'scale': 3,
        'transform': {
            'x': 0,
            'y': 0
        },
        'properties': {
            'spd': '50',
        },
        'collider': {
            'x': 0,
            'y': 0,
            'width': 16,
            'height': 16
        },
        'animations': {
            'idle': [
                {
                    'frame': 0,
                    'duration': 100
                }
            ]
        }
    */

    serialize() {
        const serialized = {
            className: this.constructor.name,
            name: this.name || 'unknown',
            resource: this.atlas.image.currentSrc,
            width: this.atlas.width,
            height: this.atlas.height,
            cols: this.atlas.cols,
            rows: this.atlas.rows,
            scale: this.level.scale,
            transform: {
                x: this.transform.x,
                y: this.transform.y,
            },
            properties: { ...this.properties },
            collider: {
                x: this.collider.x,
                y: this.collider.y,
                width: this.collider.width,
                height: this.collider.height
            },
            animations: { ...this.animations }
        };
        return serialized;
    }
}
