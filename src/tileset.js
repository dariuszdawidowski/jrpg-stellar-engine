/**
 * Tile set - multiple sprites
 */

class TileSet extends Sprite {

    /**
     * Create sprite
     * All Sprite params plus:
     * @param anim: Object - map of animations { frame: [[frame, ms], [frame, ms], ...], ... }
     */

    constructor(args) {
        super(args);

        // Animations { frame: {nr: current sequence, timer: current descending, seqence: [[frame, ms], [frame, ms], ...]}, }
        this.anim = {};

        if ('anim' in args) Object.entries(args.anim).forEach(([frame, sequence]) => {
            this.anim[frame] = {nr: 0, timer: sequence[0][1], sequence};
        });
    }

    /**
     * Returns array of screen colliders
     * @param view: View context
     * @param tiles: array [[nr, nr, ...], ...]
     * @param sx: Number - start x
     * @param sy: Number - start y
     * @param first: Number - numbering offset
     */

    getColliders(view, tiles, sx = 0, sy = 0, first = 0) {
        const colliders = [];
        let x = -sx * this.tile.scaled.factor;
        let y = -sy * this.tile.scaled.factor;
        tiles.forEach(line => {
            line.forEach(nr => {
                const index = nr - first;
                if (index > -1) {
                    colliders.push({
                        left: x,
                        top: y,
                        right: x + this.tile.scaled.width,
                        bottom: y + this.tile.scaled.height
                    });
                }
                x += this.tile.scaled.width;
            });
            x = -sx * this.tile.scaled.factor;
            y += this.tile.scaled.height;
        });
        return colliders;
    }

    /**
     * Get current frame for animation
     */

    frame(nr) {
        if (nr in this.anim) return this.anim[nr].sequence[this.anim[nr].nr][0];
        return nr;
    }


    /**
     * Update tiles animations
     */

    update(deltaTime) {

        Object.values(this.anim).forEach(anim => {
            if (anim.timer > 0) {
                anim.timer -= (deltaTime * 1000);
            }
            else {
                if (anim.nr < anim.sequence.length - 1) anim.nr ++;
                else anim.nr = 0;
                anim.timer = anim.sequence[anim.nr][1];
            }
        });

    }

    /**
     * Draw array of tiles
     * @param view: View context
     * @param tiles: array [[nr, nr, ...], ...]
     * @param sx: Number - start x
     * @param sy: Number - start y
     * @param first: Number - numbering offset
     */

    render(view, tiles, sx = 0, sy = 0, first = 0) {

        let x = (-sx * this.tile.scaled.factor) + this.tile.scaled.halfWidth;
        let y = (-sy * this.tile.scaled.factor) + this.tile.scaled.halfHeight;
        tiles.forEach(line => {
            line.forEach(nr => {
                const index = nr - first;
                if (index > -1) {
                    this.position(x, y);
                    this.cell(this.frame(index));
                    super.render(view);
                }
                x += this.tile.scaled.width;
            });
            x = (-sx * this.tile.scaled.factor) + this.tile.scaled.halfWidth;
            y += this.tile.scaled.height;
        });

    }

    /**
     * Debug array of tiles
     * @param view: View context
     * @param tiles: array [[nr, nr, ...], ...]
     * @param sx: Number - start x
     * @param sy: Number - start y
     * @param first: Number - numbering offset
     */

    debug(view, tiles, sx = 0, sy = 0, first = 0) {

        let x = (-sx * this.tile.scaled.factor) + this.tile.scaled.halfWidth;
        let y = (-sy * this.tile.scaled.factor) + this.tile.scaled.halfHeight;
        tiles.forEach(line => {
            line.forEach(nr => {
                const index = nr - first;
                if (index > -1) {
                    this.position(x, y);
                    super.debug(view);
                }
                x += this.tile.scaled.width;
            });
            x = (-sx * this.tile.scaled.factor) + this.tile.scaled.halfWidth;
            y += this.tile.scaled.height;
        });

    }

}
