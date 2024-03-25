class LoaderTSX {

    constructor(args) {
        this.canvas = args.canvas;
        this.context = args.context;
    }

    parseTileSet(xmlStr, resource) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlStr, 'application/xml');
        const tileset = doc.querySelector('tileset');
        if (tileset) {
            const image = tileset.querySelector('image');
            if (image) {
                return new TileSet({
                    canvas: this.canvas,
                    context: this.context,
                    resource: resource,
                    width: image.getAttribute('width'),
                    height: image.getAttribute('height'),
                    cell: tileset.getAttribute('tilewidth'),
                    scale: 4,
                });

            }
        }
        return null;
    }

}
