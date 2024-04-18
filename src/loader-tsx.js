/**
 * Loads .tsx Tiled Editor tileset file
 */

class LoaderTSX {

    /**
     * Parse xml
     * @param xml: string - xml to parse
     * @param resource: object - image with tiles
     * @param scale: int - scale for this tileset (default 1)
     */

    parseTileSet(args) {

        const { xml = null, resource = null, scale = 1 } = args;

        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');
        const tileset = doc.querySelector('tileset');
        if (tileset) {
            const image = tileset.querySelector('image');
            if (image) {
                return new TileSet({
                    resource: resource,
                    width: image.getAttribute('width'),
                    height: image.getAttribute('height'),
                    cell: tileset.getAttribute('tilewidth'),
                    scale
                });
            }
        }
        return null;
    }

}
