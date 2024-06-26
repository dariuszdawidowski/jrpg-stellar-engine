/**
 * Loads .tsx Tiled Editor tileset file
 */

class LoaderTSX {

    /**
     * Load and parse xml
     * @param url: string - file to fetch
     * @param resource: object - image with tiles
     * @param scale: int - scale for this tileset (default 1)
     */

    async loadTileSet(args) {
        const file = await fetch(args.url);
        const text = await file.text();
        return this.parseTileSet({ xml: text, url: args.url, resource: args?.resource, scale: args.scale });
    }

    /**
     * Parse xml
     * @param xml: string - xml to parse
     * @param url: string - url of tsx file
     * @param resource: object - image with tiles
     * @param scale: int - scale for this tileset (default 1)
     */

    parseTileSet(args) {
        const { xml = null, url = null, resource = null, scale = 1 } = args;

        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');
        const tileset = doc.querySelector('tileset');
        if (tileset) {
            const image = tileset.querySelector('image');
            if (image) {
                const params = {
                    resource: (url && !resource) ? resolvePath(url, image.getAttribute('source')) : resource,
                    width: parseInt(image.getAttribute('width')),
                    height: parseInt(image.getAttribute('height')),
                    cell: parseInt(tileset.getAttribute('tilewidth')),
                    scale
                };
                // Animations
                const anim = {};
                tileset.querySelectorAll('tile').forEach(tile => {
                    const animation = tile.querySelector('animation');
                    if (animation) {
                        const id = tile.getAttribute('id');
                        anim[id] = [];
                        animation.querySelectorAll('frame').forEach(f => {
                            const tileId = parseInt(f.getAttribute('tileid'));
                            const duration = parseInt(f.getAttribute('duration'));
                             anim[id].push([tileId, duration]);
                        });
                    }
                });
                if (Object.keys(anim).length > 0) params['anim'] = anim;
                return new TileSet(params);
            }
        }
        return null;
    }

}
