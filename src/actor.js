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
         * Movement direction vector
         */
        this.transform.vec = {
            x: 0,
            y: 0,
            dir: {x: 0, y: 0}, // direction (face direction, not cleared)
            set: function(x, y) {
                const length = Math.sqrt(x * x + y * y);
                if (length > EPSILON) {
                    const clampedLength = Math.min(length, 1);
                    const normX = x / length;
                    const normY = y / length;
                    this.x = normX * clampedLength;
                    this.y = normY * clampedLength;
                    this.dir.x = normX;
                    this.dir.y = normY;
                } else {
                    this.x = 0;
                    this.y = 0;
                }
            },
            get isUp() {
               return this.y < -EPSILON;
            },
            get isDown() {
               return this.y > EPSILON;
            },
            get isLeft() {
               return this.x < -EPSILON;
            },
            get isRight() {
               return this.x > EPSILON;
            },
            get isZero() {
                return Math.abs(this.x) < EPSILON && Math.abs(this.y) < EPSILON;
            },
            clear() {
                this.x = this.y = 0;
            }
        };

        // Collider
        this.collider = 'collider' in args ? args.collider : {x: 0, y: 0, width: this.tile.scaled.width, height: this.tile.scaled.height};

        // Origin in the center of the collider
        this.origin.x = this.collider.x + (this.collider.width / 2);
        this.origin.y = this.collider.y + (this.collider.height / 2);

        // Shadow
        this.shadow = args.shadow || false;

        // Mirror
        this.mirror = args.mirror || false;
    }

    /**
     * Idle movement
     */

    idle() {
        this.transform.vec.clear();
    }

    /**
     * Animate based on movement
     */

    animate(name = null, deltaTime = 0, loop = true) {
        // Pass named animation
        if (name) {
            super.animate(name, deltaTime, loop);
        }
        // Calculate animation name based on angle
        else {
            const angle = Math.atan2(this.transform.vec.dir.y, this.transform.vec.dir.x);
            // Right
            if (angle > -1.4 && angle < 1.4) {
                if (!this.transform.vec.isZero) super.animate('moveRight', deltaTime, loop);
                else if ('idleRight' in this.animations) super.animate('idleRight', deltaTime, loop);
                else super.animate('idle', deltaTime, loop);
            }
            // Left
            else if (angle < -2.2 || angle > 2.2) {
                if (!this.transform.vec.isZero) super.animate('moveLeft', deltaTime, loop);
                else if ('idleLeft' in this.animations) super.animate('idleLeft', deltaTime, loop);
                else super.animate('idle', deltaTime, loop);
            }
            // Up
            else if (angle <= -1.4) {
                if (!this.transform.vec.isZero) super.animate('moveUp', deltaTime, loop);
                else if ('idleUp' in this.animations) super.animate('idleUp', deltaTime, loop);
                else super.animate('idle', deltaTime, loop);
            }
            // Down
            else if (angle >= 1.4) {
                if (!this.transform.vec.isZero) super.animate('moveDown', deltaTime, loop);
                else if ('idleDown' in this.animations) super.animate('idleDown', deltaTime, loop);
                else super.animate('idle', deltaTime, loop);
            }
        }
    }

    /**
     * Returns actor's collider in world coords
     * @returns: {left, top, right, bottom}: Direction vector
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
     * Returns actor's mask (whole sprite size not depend on collider) in world coords
     * @param extend: Number - how many pixels to extend the mask in all directions
     * @returns {left, top, right, bottom}: Direction vector
     */

    getMask(extend = 0) {
        const left = this.transform.x - this.origin.x;
        const top = this.transform.y - this.origin.y;

        return {
            left: left - extend,
            top: top - extend,
            right: left + this.tile.scaled.width + extend,
            bottom: top + this.tile.scaled.height + extend
        };
    }

    /**
     * Vector collision checking
     * @param others: [Array] - collision array [{left, top, right, bottom}, ...]
     * @param deltaTime Number - time passed since last frame
     * @returns [horizontal_movement, vertical_movement] - pixels to move in each direction
     */

    collide(others, deltaTime) {
        
        // Deadzone + direction/speed from analog input
        const { x: vecX, y: vecY, magnitude } = this._applyDeadzone(
            this.transform.vec.x,
            this.transform.vec.y
        );

        if (magnitude < EPSILON) {
            return [0, 0];
        }

        // Base movement value
        const basePixels = this.properties.spd * deltaTime;

        // vecX/vecY already encode direction * magnitude, więc mnożymy wprost
        const horizontalPixels = basePixels * vecX;
        const verticalPixels = basePixels * vecY;
        
        // My collider
        const my = this.getCollider();
        
        // Collision and sliding counters
        let horizontalCollisions = 0;
        let verticalCollisions = 0;
        let slideHorizontal = 0;
        let slideVertical = 0;
        
        // Predicted position after movement
        const predictLeft = my.left + (horizontalPixels < 0 ? horizontalPixels : 0);
        const predictRight = my.right + (horizontalPixels > 0 ? horizontalPixels : 0);
        const predictTop = my.top + (verticalPixels < 0 ? verticalPixels : 0);
        const predictBottom = my.bottom + (verticalPixels > 0 ? verticalPixels : 0);
        
        // Check all potential collisions
        for (const other of others) {
            
            // Horizontal collision check
            if (Math.abs(horizontalPixels) > EPSILON) {
                if ((horizontalPixels > 0 && predictRight > other.left && predictRight < other.right) || 
                    (horizontalPixels < 0 && predictLeft < other.right && predictLeft > other.left)) {
                    
                    if (my.top < other.bottom && my.bottom > other.top) {
                        // Handle vertical sliding
                        if (my.top < other.top) {
                            slideVertical = -basePixels * this.diagonalNormalizer;
                        } else if (my.bottom > other.bottom) {
                            slideVertical = basePixels * this.diagonalNormalizer;
                        } else {
                            slideVertical = 0;
                        }
                        
                        horizontalCollisions++;

                        // Debug info
                        if (this.view && this.view.debugEnabled) {
                            this.view.addDebugBox({
                                x: other.left, y: other.top, 
                                w: other.right - other.left, 
                                h: other.bottom - other.top
                            });
                        }

                    }
                }
            }
            
            // Vertical collision check (remember that the Y axis increases downward)
            if (Math.abs(verticalPixels) > EPSILON) {
                if ((verticalPixels > 0 && predictBottom > other.top && predictBottom < other.bottom) ||
                    (verticalPixels < 0 && predictTop < other.bottom && predictTop > other.top)) {
                    
                    if (my.left < other.right && my.right > other.left) {
                        // Handle horizontal sliding
                        if (my.right > other.right) {
                            slideHorizontal = basePixels * this.diagonalNormalizer;
                        } else if (my.left < other.left) {
                            slideHorizontal = -basePixels * this.diagonalNormalizer;
                        } else {
                            slideHorizontal = 0;
                        }
                        
                        verticalCollisions++;

                        // Debug info
                        if (this.view && this.view.debugEnabled) {
                            this.view.addDebugBox({
                                x: other.left, y: other.top, 
                                w: other.right - other.left, 
                                h: other.bottom - other.top
                            });
                        }

                    }
                }
            }
        }
        
        // Calculate final movement
        const finalHorizontal = horizontalCollisions > 0 ? 0 : horizontalPixels;
        const finalVertical = verticalCollisions > 0 ? 0 : verticalPixels;
        
        // Apply sliding only if there is no blockage in the sliding direction
        const finalSlideH = verticalCollisions > 1 ? 0 : slideHorizontal;
        const finalSlideV = horizontalCollisions > 1 ? 0 : slideVertical;
        
        return [finalHorizontal + finalSlideH, finalVertical + finalSlideV];
    }

    /**
     * Applies radial deadzone and returns direction + speed scale.
     * Works correctly for both digital input (keyboard, magnitude 0/1/√2)
     * and analog input (gamepad, magnitude 0.0–1.0).
     */

    _applyDeadzone(x, y, deadzone = 0.15) {
        const magnitude = Math.sqrt(x * x + y * y);

        if (magnitude < deadzone) {
            return { x: 0, y: 0, magnitude: 0 };
        }

        // Clamp to unit circle (handles keyboard diagonals >1, or
        // imprecise stick calibration going slightly outside the circle)
        const clampedMagnitude = Math.min(magnitude, 1);

        // Rescale so speed goes smoothly from 0 (at deadzone edge) to 1 (full tilt),
        // instead of jumping straight from 0 to "deadzone speed"
        const scaledMagnitude = (clampedMagnitude - deadzone) / (1 - deadzone);

        return {
            x: (x / magnitude) * scaledMagnitude,
            y: (y / magnitude) * scaledMagnitude,
            magnitude: scaledMagnitude
        };
    }

    /**
     * Transform
     * @param x Number - how many pixels to move in X axis
     * @param y Number - how many pixels to move in Y axis
     */

    move(x, y) {
        this.transform.x += x;
        this.transform.y += y;
    }

    /**
     * Right stairs/slope checking with smoother angle-based movement
     * @param others: [Stairs, ...] - collision array
     * @param deltaTime Number - time passed since last frame
     */

    stairsRight(others, deltaTime) {

        // Move by pixels
        const pixels = this.properties.spd * deltaTime;

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
        for (const other of others) {
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
                const centerCorrection = centerOffset * attractionStrength * deltaTime;

                return -verticalAdjustment + centerCorrection;
            }
        }
        
        return null;
    }

    /**
     * Left stairs/slope checking
     * @param others: [Stairs, ...] - collision array
     * @param deltaTime Number - time passed since last frame
     */

    stairsLeft(others, deltaTime) {

        // Move by pixels
        const pixels = this.properties.spd * deltaTime;

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
        for (const other of others) {
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
                const centerCorrection = centerOffset * attractionStrength * deltaTime;

                return verticalAdjustment + centerCorrection;
            }
        }
        
        return null;
    }

    /**
     * Collision checking with other sprite
     * @param other: Sprite object - other
     * @returns {boolean} - true if colliding, false otherwise
     */

    collideWithSprite(other) {

        // My collider
        const my = this.getCollider();

        // That collider
        const that = other.getCollider();

        // Check for AABB overlap
        return box4Box(my, that);
    }

    /**
     * Collision with mask checking with other sprite
     * @param other: Sprite object - other
     * @param extend: Number - how many pixels to extend the mask in all directions
     * @returns {boolean} - true if colliding, false otherwise
     */

    collideWithMask(other, extend = 0) {

        // My collider
        const my = this.getMask(extend);

        // That collider
        const that = other.getMask(extend);

        // Check for AABB overlap
        return box4Box(my, that);
    }

    /**
     * Generic collision checking
     * @param other: object - collision {left: Number, top: Number, right: Number, bottom: Number}
     * @returns {boolean} - true if colliding, false otherwise
     */

    collideWithBox(other) {

        // My collider
        const my = this.getCollider();

        // Check for AABB overlap
        return box4Box(my, other);
    }

    /**
     * Update actor
     */

    update() {
        /*** Overload ***/
    }

    /**
     * Render actor mirror (for reflection effects)
     */

    renderMirror(view) {
        super.cell(this.anim.frame());
        super.renderMirror(view);
    }

    /**
     * Render a flat ellipse shadow at an actor's feet
     * @param actor.shadow: true (defaults) | {rx, ry, offsetY, alpha} - enables/configures the shadow
     */

    renderShadow(view) {
        const shadow = this.shadow === true ? {} : this.shadow;
        const rx = shadow.rx ?? this.tile.scaled.halfWidth * 0.75;
        const ry = shadow.ry ?? rx * 0.35;
        const alpha = shadow.alpha ?? 0.5;
        const offsetY = shadow.offsetY ?? 5;
        const foot = view.world2Screen({
            x: this.transform.x,
            y: this.transform.y + offsetY
        });

        view.ctx.save();
        view.ctx.translate(foot.x, foot.y);
        view.ctx.imageSmoothingEnabled = false;
        view.ctx.scale(1, ry / rx);
        const gradient = view.ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        view.ctx.fillStyle = gradient;
        view.ctx.beginPath();
        view.ctx.arc(0, 0, rx, 0, Math.PI * 2);
        view.ctx.fill();
        view.ctx.restore();
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
        'slug': 'mob',
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
            slug: this.slug,
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
