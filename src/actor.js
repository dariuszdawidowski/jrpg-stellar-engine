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
        else if (('idleLeft' in this.animations) && this.transform.vec.isLeft) {
            this.animate('idleLeft');
        }

        // Directional idle right
        else if (('idleRight' in this.animations) && this.transform.vec.isRight) {
            this.animate('idleRight');
        }

        // Directional idle top
        else if (('idleUp' in this.animations) && this.transform.vec.isUp) {
            this.animate('idleUp');
        }

        // Directional idle bottom
        else if (('idleDown' in this.animations) && (this.transform.vec.isDown || this.transform.vec.isZero)) {
            this.animate('idleDown');
        }

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
            const angle = Math.atan2(this.transform.vec.y, this.transform.vec.x);
            if (angle > -1.4 && angle < 1.4) super.animate('moveRight', deltaTime, loop);
            else if (angle < -2.2 || angle > 2.2) super.animate('moveLeft', deltaTime, loop);
            else if (angle <= -1.4) super.animate('moveUp', deltaTime, loop);
            else if (angle >= 1.4) super.animate('moveDown', deltaTime, loop);
        }
    }

    /**
     * Returns actor's collider in world coords
     * @param args: {left, top, right, bottom}: Direction vector
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
     * Vector collision checking
     * @param others: [Array] - collision array [{left, top, right, bottom}, ...]
     * @param deltaTime Number - time passed since last frame
     * @returns [horizontal_movement, vertical_movement] - pixels to move in each direction
     */

    collide(others, deltaTime) {

        // If the vector is zero, there is no need to check for collisions
        if (this.transform.vec.isZero) {
            return [0, 0];
        }
        
        // Bazowa wartość ruchu
        const basePixels = this.properties.spd * deltaTime;
        
        // Normalizacja wektora ruchu (aby ruch po przekątnej nie był szybszy)
        let vecX = this.transform.vec.x;
        let vecY = this.transform.vec.y;
        
        if (Math.abs(vecX) > EPSILON || Math.abs(vecY) > EPSILON) {
            const vecLength = Math.sqrt(vecX * vecX + vecY * vecY);
            vecX /= vecLength;
            vecY /= vecLength;
        }
        
        // Obliczenie potencjalnego ruchu
        const horizontalPixels = basePixels * vecX;
        const verticalPixels = basePixels * vecY;
        
        // Mój collider
        const my = this.getCollider();
        
        // Liczniki kolizji i ślizgania
        let horizontalCollisions = 0;
        let verticalCollisions = 0;
        let slideHorizontal = 0;
        let slideVertical = 0;
        
        // Przewidywana pozycja po ruchu
        const predictLeft = my.left + (horizontalPixels < 0 ? horizontalPixels : 0);
        const predictRight = my.right + (horizontalPixels > 0 ? horizontalPixels : 0);
        const predictTop = my.top + (verticalPixels < 0 ? verticalPixels : 0);
        const predictBottom = my.bottom + (verticalPixels > 0 ? verticalPixels : 0);
        
        // Sprawdzenie wszystkich potencjalnych kolizji
        for (const other of others) {
            // Debug info
            if (this.view && this.view.debugEnabled) {
                this.view.debugBox.push({
                    x: other.left, y: other.top, 
                    w: other.right - other.left, 
                    h: other.bottom - other.top
                });
            }
            
            // Sprawdzenie kolizji poziomej
            if (Math.abs(horizontalPixels) > EPSILON) {
                if ((horizontalPixels > 0 && predictRight > other.left && predictRight < other.right) || 
                    (horizontalPixels < 0 && predictLeft < other.right && predictLeft > other.left)) {
                    
                    if (my.top < other.bottom && my.bottom > other.top) {
                        // Obsługa ślizgania pionowego
                        if (my.top < other.top) {
                            slideVertical = -basePixels * this.diagonalNormalizer;
                        } else if (my.bottom > other.bottom) {
                            slideVertical = basePixels * this.diagonalNormalizer;
                        } else {
                            slideVertical = 0;
                        }
                        
                        horizontalCollisions++;
                    }
                }
            }
            
            // Sprawdzenie kolizji pionowej (pamiętając, że oś Y rośnie w dół)
            if (Math.abs(verticalPixels) > EPSILON) {
                if ((verticalPixels > 0 && predictBottom > other.top && predictBottom < other.bottom) ||
                    (verticalPixels < 0 && predictTop < other.bottom && predictTop > other.top)) {
                    
                    if (my.left < other.right && my.right > other.left) {
                        // Obsługa ślizgania poziomego
                        if (my.right > other.right) {
                            slideHorizontal = basePixels * this.diagonalNormalizer;
                        } else if (my.left < other.left) {
                            slideHorizontal = -basePixels * this.diagonalNormalizer;
                        } else {
                            slideHorizontal = 0;
                        }
                        
                        verticalCollisions++;
                    }
                }
            }
        }
        
        // Obliczenie końcowego ruchu
        const finalHorizontal = horizontalCollisions > 0 ? 0 : horizontalPixels;
        const finalVertical = verticalCollisions > 0 ? 0 : verticalPixels;
        
        // Zastosowanie ślizgania tylko jeśli nie ma blokady w kierunku ślizgania
        const finalSlideH = verticalCollisions > 1 ? 0 : slideHorizontal;
        const finalSlideV = horizontalCollisions > 1 ? 0 : slideVertical;
        
        return [finalHorizontal + finalSlideH, finalVertical + finalSlideV];
    }

    /**
     * Transform
     * @param x Number - how many pixels to move in X axis
     * @param y Number - how many pixels to move in Y axis
     */

    move(x, y) {

        // Move
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
     * Generic collision checking
     * @param other: object - collision {left: Number, top: Number, right: Number, bottom: Number}
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
