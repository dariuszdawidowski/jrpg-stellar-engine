/**
 * Loads .tmx Tiled Editor level file
 * https://doc.mapeditor.org/en/stable/reference/tmx-map-format/
 */

class LoaderTMX {

    /**
     * TMX loader constructor
     * @param args.tilesets - optional tilesets dict
     */

    constructor(args = {}) {

        // Tilesets
        this.tilesets = 'tilesets' in args ? args.tilesets : null;

        // Loaders
        this.loader = {
            tsx: new LoaderTSX(),
            acx: new LoaderACX()
        };

    }

    /**
     * Load and parse level
     * @param url: string - fetch url
     * @param scale: int - scale for this level (default 1)
     * @param prefetch: bool - prefetch .acx & .tsx resources
     */

    async loadLevel(args) {

        const { url = null, scale = 1, prefetch = true } = args;
        const file = await fetch(url);
        const text = await file.text();
        const level = await this.parseLevel({ xml: text, url, scale, prefetch });
        return level;
    }

    /**
     * Parse .tmx xml
     * @param xml: string - xml to parse
     * @param url: string - map's file url
     * @param scale: int - scale for this level (default 1)
     * @param prefetch: bool - prefetch .acx & .tsx resources
     */

    async parseLevel(args) {

        const { xml = null, url = null, scale = 1, prefetch = true } = args;

        // Parse XML
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');

        // Create Level instance to return to
        const level = new Level();

        // Scale
        level.scale = scale;

        // Resources list 
        const resources = {
            // {'name': { url: '/url/of/file.tsx', buffer: <fetched buffer>, tileset: <TileSet object>}, ...}
            tsx: {},
            // {'/url/of/file.acx': <fetched buffer>, ...}
            acx: {}
        };

        // Parse global level properties
        level.properties = parseProperties(doc.querySelector('map > properties'));

        // Pre-parse for fetching resources
        if (prefetch) {
            for (const node of doc.querySelector('map').childNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {

                    // Tileset
                    if (node.nodeName == 'tileset') {
                        const tilesetName = node.getAttribute('source');
                        resources.tsx[tilesetName] = {url: resolvePath(url, tilesetName), buffer: null, tileset: null};
                    }

                    // Objects layer
                    else if (node.nodeName == 'objectgroup') {
                        node.querySelectorAll('object').forEach(obj => {
                            const name = obj.getAttribute('name').toLowerCase();
                            const type = obj.getAttribute('type').toLowerCase();
                            const properties = parseProperties(obj.querySelector('properties'));

                            // ACX from spawn points
                            if (type == 'spawn') {
                                if ('actor' in properties) {
                                    resources.acx[properties.actor] = null;
                                }
                                else if (name.search(':') != -1) {
                                    const [kind, uri] = name.split(':');
                                    if (kind && uri) resources.acx[uri] = null;
                                }
                            }

                        });
                    }

                }
            }

            // Fetch tsx resources
            const tsxPromises = Object.keys(resources.tsx).map(async name => {
                const tsxFile = await fetch(resources.tsx[name].url);
                const tsxText = await tsxFile.text();
                resources.tsx[name].buffer = tsxText;
                resources.tsx[name].tileset = await this.loader.tsx.parseTileSet({
                    xml: resources.tsx[name].buffer,
                    url: resources.tsx[name].url,
                    preload: true,
                    scale
                });
            });
            await Promise.all(tsxPromises);

            // Fetch acx resources
            const acxPromises = Object.keys(resources.acx).map(async url => {
                const acxFile = await fetch(url);
                const acxText = await acxFile.text();
                resources.acx[url] = acxText;
            });
            await Promise.all(acxPromises);

        }

        // Parse
        for (const node of doc.querySelector('map').childNodes) {
             if (node.nodeType === Node.ELEMENT_NODE) {
                switch (node.nodeName) {

                    // Tileset
                    case 'tileset':
                        const tilesetName = node.getAttribute('source');
                        const tilesetFirst = parseInt(node.getAttribute('firstgid'));
                        if (tilesetName && tilesetFirst) {
                            // Tilesets passed in contructor
                            if (this.tilesets) {
                                level.tilesets[tilesetName] = {ref: this.tilesets[tilesetName], first: tilesetFirst};
                            }
                            // Tilesets prefetched in resources
                            else {
                                level.tilesets[tilesetName] = {
                                    ref: resources.tsx[tilesetName].tileset,
                                    first: tilesetFirst
                                };
                            }
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
                                img.src = url ? resolvePath(url, imageSource) : imageSource;
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
                        const layerName = node.getAttribute('name').toLowerCase();
                        const layer = {
                            'name': layerName,
                            'class': 'objects',
                            'actors': []
                        }
                        level.layers.push(layer);
                        node.querySelectorAll('object').forEach(obj => {

                            // Parse attributes
                            const name = obj.getAttribute('name').toLowerCase();
                            const type = obj.getAttribute('type').toLowerCase();
                            const x = parseFloat(obj.getAttribute('x')) * scale;
                            const y = parseFloat(obj.getAttribute('y')) * scale;
                            const w = obj.hasAttribute('width') ? parseFloat(obj.getAttribute('width')) * scale : 0;
                            const h = obj.hasAttribute('height') ? parseFloat(obj.getAttribute('height')) * scale : 0;

                            // Parse properties
                            const properties = parseProperties(obj.querySelector('properties'));

                            // Spawn point
                            if (type == 'spawn') {

                                // Add point to list of spawnpoints
                                if (!(name in level.spawnpoints)) level.spawnpoints[name] = [];
                                level.spawnpoints[name].push({x, y, ...properties});

                                // Determine URI
                                let kindName = '';
                                let uri = null;
                                
                                if ('actor' in properties) {
                                    kindName = 'npc';
                                    uri = properties.actor;
                                }
                                else if (name.search(':') != -1) {
                                    const twin = name.split(':');
                                    kindName = twin[0].toLowerCase();
                                    uri = twin[1];
                                }

                                // Actual spawn
                                if (uri) {
                                    for (let n = 0; n < (properties.number || 1); n++) {
                                        const spawnPos = {
                                            x: x + (w / 2) + Math.floor(Math.random() * (w + 1) - (w / 2)),
                                            y: y + (h / 2) + Math.floor(Math.random() * (h + 1) - (h / 2))
                                        };
                                        this.spawn({
                                            name: kindName,
                                            uri,
                                            xml: (uri in resources.acx) ? resources.acx[uri] : document.getElementById(uri).innerText,
                                            transform: spawnPos,
                                            scale,
                                            level,
                                            layer,
                                            properties
                                        });
                                    }
                                }
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
                                if (name.search(':') != -1) {
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
     * Spawn helper
     */

    spawn(args) {
        // Determine naming
        const kindCount = (args.name in args.level.actors) ? Object.keys(args.level.actors[args.name]).length + 1 : 1;
        const actorID = `${args.uri}.${kindCount}`;

        // Add to layer registry
        if (!args.layer.actors.includes(actorID)) args.layer.actors.push(actorID);

        // Add to global actors registry
        if (!(args.name in args.level.actors)) args.level.actors[args.name] = {};

        // Parse ACX
        args.level.actors[args.name][actorID] = this.loader.acx.parseActor({
            xml: args.xml,
            transform: args.transform,
            scale: args.scale,
            properties: args.properties
        });
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
