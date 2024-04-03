/**
 * Loads .tsx Tiled Editor tileset file
 */

class LoaderTSX {

    parseTileSet(xmlStr, resource, scale) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlStr, 'application/xml');
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
