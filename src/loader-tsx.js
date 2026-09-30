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
        const file = assertFetchResponseOk(await fetch(args.url), args.url);
        const text = await file.text();
        const tileset = await this.parseTileSet({ xml: text, url: args.url, resource: args?.resource, scale: args.scale });
        return tileset;
    }

    /**
     * Parse xml
     * @param xml: string - xml to parse
     * @param url: string - url of tsx file
     * @param resource: object - image with tiles
     * @param scale: int - scale for this tileset (default 1)
     * @param preload: bool - preload atlas image (default false)
     */

    async parseTileSet(args) {
        const { xml = null, url = null, resource = null, scale = 1, preload = false } = args;

        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');
        const source = url || 'TSX input';
        const tileset = getXmlRoot(doc, 'tileset', source);

        // Image
        const image = tileset.querySelector('image');
        if (!image) throw new Error(`Invalid XML in ${source}: missing <image> element`);

        const imageSource = image.getAttribute('source');
        if (!imageSource) throw new Error(`Invalid XML in ${source}: <image> requires a "source"`);

        const params = {
            resource: (url && !resource) ? resolvePath(url, imageSource) : resource,
            width: getPositiveIntegerAttribute(image, 'width', source, 'image'),
            height: getPositiveIntegerAttribute(image, 'height', source, 'image'),
            cell: getPositiveIntegerAttribute(tileset, 'tilewidth', source, 'tileset'),
            scale
        };

        // Preload image
        if (preload) {
            params.resource = await this.fetchImage(params.resource);
        }

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
        const newTileset = new TileSet(params);
        await newTileset.load();
        return newTileset;
    }

    async fetchImage(url) {
        const response = assertFetchResponseOk(await fetch(url), url);
        const blob = await response.blob();
        const imageURL = URL.createObjectURL(blob);
        const img = new Image();
        try {
            let resourcesDiv = document.querySelector('#resources');
            if (!resourcesDiv) {
                resourcesDiv = document.createElement('div');
                resourcesDiv.id = 'resources';
                resourcesDiv.style.display = 'none';
                document.body.appendChild(resourcesDiv);
            }
            resourcesDiv.appendChild(img);
            await waitForImageLoad(img, url, imageURL);
            return img;
        } finally {
            URL.revokeObjectURL(imageURL);
        }
    }

}
