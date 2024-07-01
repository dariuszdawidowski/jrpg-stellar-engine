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

        // Tilesets
        this.tilesets = tilesets;
    }

    /**
     * Load and parse level
     * @param url: string - fetch url
     * @param prefix: string - prefix path for load resources (optional)
     * @param scale: int - scale for this level (default 1)
     */

    async loadLevel(args) {
        const file = await fetch(args.url);
        const text = await file.text();
        return this.parseLevel({ xml: text, prefix: args.prefix, scale: args.scale });
    }

    /**
     * Parse .tmx xml
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
                        const imageOffsetX = node.hasAttribute('offsetx') ? parseInt(node.getAttribute('offsetx')) : 0;
                        const imageOffsetY = node.hasAttribute('offsety') ? parseInt(node.getAttribute('offsety')) : 0;
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
                                'x':  imageOffsetX,
                                'y':  imageOffsetY,
                                'w': imageWidth,
                                'h': imageHeight,
                                'repeat': {
                                    'x': imageRepeatX,
                                    'y': imageRepeatY
                                },
                                'parallax': {
                                    'x': imageParallaxX,
                                    'y': imageParallaxY
                                },
                                'coordinates': 'world'
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
                        if (data && !name.trim().startsWith('.')) {
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
                            const x = parseFloat(obj.getAttribute('x')) * scale;
                            const y = parseFloat(obj.getAttribute('y')) * scale;

                            // Spawn point
                            if (type == 'spawn') {
                                if (!(name in level.spawnpoints)) level.spawnpoints[name] = [];
                                level.spawnpoints[name].push({x, y});
                            }

                            // Stairs
                            else if (type == 'stairs') {
                                const points = obj.querySelector('polygon')?.getAttribute('points')?.split(' ');
                                const [x1, y1] = points[0].split(',');
                                const [x2, y2] = points[1].split(',');
                                const [x3, y3] = points[2].split(',');
                                const [x4, y4] = points[3].split(',');
                                level.stairs.push({
                                    x1: x + (parseFloat(x1) * scale),
                                    y1: y + (parseFloat(y1) * scale),
                                    x2: x + (parseFloat(x2) * scale),
                                    y2: y + (parseFloat(y2) * scale),
                                    x3: x + (parseFloat(x3) * scale),
                                    y3: y + (parseFloat(y3) * scale),
                                    x4: x + (parseFloat(x4) * scale),
                                    y4: y + (parseFloat(y4) * scale)
                                });
                            }

                            // Portals
                            else if (type == 'portal') {
                                const name = obj.getAttribute('name');
                                if (name.search('.') != -1) {
                                    const [map, spawn] = name.split(':');
                                    const x = parseFloat(obj.getAttribute('x')) * scale;
                                    const y = parseFloat(obj.getAttribute('y')) * scale;
                                    const w = parseFloat(obj.getAttribute('width')) * scale;
                                    const h = parseFloat(obj.getAttribute('height')) * scale;
                                    level.portals.push({
                                        map: map.trim(),
                                        spawn: spawn.trim(),
                                        left: x,
                                        top: y,
                                        right: x + w,
                                        bottom: y + h
                                    });
                                }
                                else {
                                    console.error('Bad name formatting for portal! Use: map.spawn');
                                }
                            }

                        });
                        break;

                }
            }
        }

        // Bake precalculations
        level.precalcStairs();

        return level;
    }

    /**
     * Util to generate 2d array
     * @param arr: Array
     * @param width: Number
     */

    create2DArray(arr, width) {
        let result = [];
        for (let i = 0; i < arr.length; i += width) {
            result.push(arr.slice(i, i + width));
        }
        return result;
    }

}
