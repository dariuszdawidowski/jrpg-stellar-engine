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
     * Update animation
     * @param name: string - time passed since last frame
     * @param deltaTime: Number - time passed since last frame
     */

    animate(name, deltaTime = 0) {
        if (this.anim.name != name) {
            if (name in this.animations) this.anim.start(name, this.animations[name]);
            else console.error(`Can't find animation '${name}' in the ${this.name}!`)
        }
        else {
            this.anim.advance(deltaTime);
        }
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
