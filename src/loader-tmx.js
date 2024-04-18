/**
 * Loads .tmx Tiled Editor level file
 * https://doc.mapeditor.org/en/stable/reference/tmx-map-format/
 */

class LoaderTMX {

    /**
     * TMX loader constructor
     * @param tilesets: {'name': reference, ...}
     */

    constructor(tilesets) {
        this.tilesets = tilesets;
    }

    /**
     * Parse xml
     * @param xml: string - xml to parse
     * @param prefix: string - prefix path for load resources (optional)
     * @param scale: int - scale for this level (default 1)
     */

    parseLevel(args) {

        const { xml = null, prefix = '', scale = 1 } = args;

        // Parse XML
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');

        // Create Level instance to return to
        const level = new Level();

        // Scale
        level.scale = scale;

        for (const node of doc.querySelector('map').childNodes) {
             if (node.nodeType === Node.ELEMENT_NODE) {
                switch (node.nodeName) {

                    // Tileset
                    case 'tileset':
                        const tilesetName = node.getAttribute('source');
                        const tilesetFirst = parseInt(node.getAttribute('firstgid'));
                        if (tilesetName && tilesetFirst) {
                            level.tilesets[tilesetName] = {ref: this.tilesets[tilesetName], first: tilesetFirst};
                        }
                        break;

                    // Image
                    case 'imagelayer':
                        const imageName = node.getAttribute('name');
                        const imageRepeatX = node.hasAttribute('repeatx') ? parseInt(node.getAttribute('repeatx')) : 0;
                        const imageRepeatY = node.hasAttribute('repeaty') ? parseInt(node.getAttribute('repeaty')) : 0;
                        const imageParallaxX = node.hasAttribute('parallaxx') ? parseFloat(node.getAttribute('parallaxx')) : 0;
                        const imageParallaxY = node.hasAttribute('parallaxy') ? parseFloat(node.getAttribute('parallaxy')) : 0;
                        const nodeImage = node.querySelector('image');
                        const imageSource = nodeImage.getAttribute('source');
                        const imageWidth = parseInt(nodeImage.getAttribute('width'));
                        const imageHeight = parseInt(nodeImage.getAttribute('height'));
                        if (imageName && imageSource) {
                            const layer = {
                                'name': imageName,
                                'class': 'image',
                                'src': null,
                                'w': imageWidth,
                                'h': imageHeight,
                                'repeat': {
                                    'x': imageRepeatX,
                                    'y': imageRepeatY
                                },
                                'parallax': {
                                    'x': imageParallaxX,
                                    'y': imageParallaxY
                                }
                            };
                            // Load from html resource
                            if (imageSource.startsWith('#')) {
                                layer.src = document.querySelector(imageSource);
                            }
                            // Load from file
                            else {
                                const img = new Image();
                                img.src = prefix + imageSource;
                                layer.src = img;
                            }
                            if (layer.src) level.layers.push(layer);
                        }
                        break;

                    // Layer
                    case 'layer':
                        const name = node.getAttribute('name').toLowerCase();
                        const cl = node.hasAttribute('class') ? node.getAttribute('class').toLowerCase() : '';
                        const data = node.querySelector('data');
                        const offsetX = node.hasAttribute('offsetx') ? node.getAttribute('offsetx').toLowerCase() : null;
                        const offsetY = node.hasAttribute('offsety') ? node.getAttribute('offsety').toLowerCase() : null;
                        if (data) {
                            const arrayContent = data.textContent.split(',').map(Number);
                            const layer = {
                                'name': name,
                                'class': cl,
                                'offset': {x: 0, y: 0},
                                'map': this.create2DArray(arrayContent, parseInt(node.getAttribute('width')))
                            };
                            if (offsetX !== null) layer.offset.x = offsetX;
                            if (offsetY !== null) layer.offset.y = offsetY;
                            level.layers.push(layer);
                        }
                        break;

                    // Objects
                    case 'objectgroup':
                        level.layers.push({
                            'name': 'objects',
                            'class': 'objects'
                        });
                        node.querySelectorAll('object').forEach(obj => {
                            const name = obj.getAttribute('name').toLowerCase();
                            const type = obj.getAttribute('type').toLowerCase();
                            const x = parseInt(obj.getAttribute('x'));
                            const y = parseInt(obj.getAttribute('y'))
                            if (name == 'level' && type == 'center') {
                                level.offset.x = x;
                                level.offset.y = y;
                            }
                            else if (type == 'spawn') {
                                if (!(name in level.spawnpoints)) level.spawnpoints[name] = [];
                                level.spawnpoints[name].push({x, y});
                            }
                        });
                        break;

                }
            }
        }

        return level;
    }

    create2DArray(arr, width) {
        let result = [];
        for (let i = 0; i < arr.length; i += width) {
            result.push(arr.slice(i, i + width));
        }
        return result;
    }

}
