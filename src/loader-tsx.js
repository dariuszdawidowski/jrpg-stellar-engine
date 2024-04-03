/**
 * Loads .tsx Tiled Editor tileset file
 */

class LoaderTSX {

    constructor(args) {
        this.canvas = args.canvas;
        this.context = args.context;
        this.scale = 'scale' in args ? args.scale : 1;
    }

    parseTileSet(xmlStr, resource) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlStr, 'application/xml');
        const tileset = doc.querySelector('tileset');
        if (tileset) {
            const image = tileset.querySelector('image');
            if (image) {
                return new Sprite({
                    canvas: this.canvas,
                    context: this.context,
                    resource: resource,
                    width: image.getAttribute('width'),
                    height: image.getAttribute('height'),
                    cell: tileset.getAttribute('tilewidth'),
                    scale: this.scale,
                });
            }
        }
        return null;
    }

}
