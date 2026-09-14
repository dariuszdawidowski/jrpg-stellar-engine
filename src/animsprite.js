/**
 * AnimSprite - animated sprite
 */

class AnimSprite extends Sprite {

    /**
     * Create animated sprite
     * All Sprite params plus:
     * @param animations: Object - map of animations { animName: [{frame: nr, duration: ms}, ...], ... }
     */

    constructor(args) {
        super(args);

        // Bake frames number when provided as [x,y]
        for (const key in args.animations) {
            for (const animation of args.animations[key]) {
                if (Array.isArray(animation.frame) && animation.frame.length === 2 && typeof animation.frame[0] === 'number' && typeof animation.frame[1] === 'number') {
                    animation.frame = animation.frame[0] + (animation.frame[1] * args.cols);
                }
            }
        }

        // Current animation state
        this.anim = {

            // Animation map
            animations: ('animations' in args) ? args.animations : {},

            // Animation name
            name: null,

            // Frames list from this.animations
            frames: null,

            // Current frame counter
            index: 0,

            // Current time of the animation frame
            time: 0,

            // Loop flag for the animation
            loop: true,

            // Current animation priority
            priority: 0,

            // Continue current anim or start new one if necessary
            play: function(name, loop = true, priority = 0) {
                if (this.name !== name && this.priority <= priority) {
                    this.name = name;
                    this.frames = this.animations[name];
                    this.index = 0;
                    this.time = 0;
                    this.priority = priority;
                    this.loop = loop;
                }
            },

            // Play forward a little bit
            update: function(deltaTime) {
                if (this.name) {
                    this.time += deltaTime;
                    // Check if the current frame's duration has elapsed
                    if (this.time * 1000 >= this.frames[this.index].duration) {
                        this.time = this.time - (this.frames[this.index].duration / 1000);
                        // Advance to the next frame
                        if (this.index < this.frames.length - 1) {
                            this.index ++;
                        }
                        // Last frame reached
                        else {
                            // Go back to the first frame if looping
                            if (this.loop) {
                                this.index = 0;
                            }
                            // Stop the animation if not looping
                            else {
                                this.stop();
                            }
                        }
                    }
                }
            },

            stop: function() {
                this.name = null;
                this.frames = null;
                this.index = 0;
                this.time = 0;
                this.priority = 0;
            },

            // Get current tile index
            frame: function() {
                return this.frames ? this.frames[this.index].frame : 0;
            }
        };

    }

    /**
     * Update
     */

    update(deltaTime = 0) {
        this.anim.update(deltaTime);
    }

    /**
     * Render animated sprite
     */

    render(view) {
        super.position(this.transform.x, this.transform.y);
        super.cell(this.anim.frame());
        super.render(view);
    }

}
