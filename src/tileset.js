/**
 * Tile set - multiple sprites
 */

class TileSet extends Sprite {

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
                    this.cell(index);
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
