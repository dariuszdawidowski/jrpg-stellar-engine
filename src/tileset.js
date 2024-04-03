class TileSet extends Sprite {

    /**
     * Draw array of tiles
     * @param tiles: array [[nr, nr, ...], ...]
     */

    render(render, tiles, first = 0) {

        let x = 0;
        let y = 0;
        tiles.forEach(line => {
            line.forEach(nr => {
                const index = nr - first;
                if (index > -1) {
                    this.position(x, y);
                    this.cell(index);
                    super.render(render);
                }
                x += this.tile.scaled.width;
            });
            x = 0;
            y += this.tile.scaled.height;
        });

    }

}
