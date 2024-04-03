class TileSet extends Sprite {

    /**
     * Draw array of tiles
     * @param context: Render context
     * @param tiles: array [[nr, nr, ...], ...]
     * @param sx: Number - start x
     * @param sy: Number - start y
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

}
