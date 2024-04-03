/*** Tile set **/

class TileSet extends Sprite {

    /**
     * Returns array of screen colliders
     * @param context: Render context
     * @param tiles: array [[nr, nr, ...], ...]
     * @param sx: Number - start x
     * @param sy: Number - start y
     * @param first: Number - numbering offset
     */

    getColliders(context, tiles, sx = 0, sy = 0, first = 0) {
        const colliders = [];
        let x = (-sx * this.tile.scaled.factor) + context.canvasCenter.x;
        let y = (-sy * this.tile.scaled.factor) + context.canvasCenter.y;
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
            x = (-sx * this.tile.scaled.factor) + context.canvasCenter.x;
            y += this.tile.scaled.height;
        });
        return colliders;
    }

    /**
     * Draw array of tiles
     * @param context: Render context
     * @param tiles: array [[nr, nr, ...], ...]
     * @param sx: Number - start x
     * @param sy: Number - start y
     * @param first: Number - numbering offset
     */

    render(context, tiles, sx = 0, sy = 0, first = 0) {

        let x = (-sx * this.tile.scaled.factor) + this.tile.scaled.halfWidth;
        let y = (-sy * this.tile.scaled.factor) + this.tile.scaled.halfHeight;
        tiles.forEach(line => {
            line.forEach(nr => {
                const index = nr - first;
                if (index > -1) {
                    this.position(x, y);
                    this.cell(index);
                    super.render(context);
                }
                x += this.tile.scaled.width;
            });
            x = (-sx * this.tile.scaled.factor) + this.tile.scaled.halfWidth;
            y += this.tile.scaled.height;
        });

    }

    /**
     * Debug array of tiles
     * @param context: Render context
     * @param tiles: array [[nr, nr, ...], ...]
     * @param sx: Number - start x
     * @param sy: Number - start y
     * @param first: Number - numbering offset
     */

    debug(context, tiles, sx = 0, sy = 0, first = 0) {

        let x = (-sx * this.tile.scaled.factor) + this.tile.scaled.halfWidth;
        let y = (-sy * this.tile.scaled.factor) + this.tile.scaled.halfHeight;
        tiles.forEach(line => {
            line.forEach(nr => {
                const index = nr - first;
                if (index > -1) {
                    this.position(x, y);
                    super.debug(context);
                }
                x += this.tile.scaled.width;
            });
            x = (-sx * this.tile.scaled.factor) + this.tile.scaled.halfWidth;
            y += this.tile.scaled.height;
        });

    }

}
