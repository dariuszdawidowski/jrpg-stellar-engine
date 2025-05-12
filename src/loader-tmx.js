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
            tsx: new LoaderTSX()
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

        // Parse global level properties
        level.properties = parseProperties(doc.querySelector('map > properties'));

        // Resources list 
        const resources = await this.fetchResources(doc.querySelector('map'), url, scale, prefetch);

        // Parse
        for (const node of doc.querySelector('map').childNodes) {
             if (node.nodeType === Node.ELEMENT_NODE) {
                switch (node.nodeName) {
                    // Tileset
                    case 'tileset':
                        this.parseTileSet(level, resources, node);
                        break;

                    // Image
                    case 'imagelayer':
                        this.parseImageLayer(level, url, node);
                        break;

                    // Layer
                    case 'layer':
                        this.parseLayer(level, node);
                        break;

                    // Objects
                    case 'objectgroup':
                        this.parseObjectGroup(level, resources, node);
                        break;
                }
            }
        }

        // Bake precalculations
        level.precalcStairs();

        return level;
    }

    /**
     * Init and fetch resoruces if necesssary
     */

    async fetchResources(selector, url, scale, prefetch) {
        const resources = {
            // {'name': { url: '/url/of/file.tsx', buffer: <fetched buffer>, tileset: <TileSet object>}, ...}
            tsx: {},
            // {'/url/of/file.acx': <fetched buffer>, ...}
            acx: {}
        };

        // Pre-parse for fetching resources
        if (prefetch) {
            for (const node of selector.childNodes) {
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

                            // ACX from spawn/respawn points
                            if (type == 'spawn' || type == 'respawn') {
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

        return resources;
    }

    /**
     * Parse <tileset firstgid="1" source="foo.tsx"/>
     */

    parseTileSet(level, resources, node) {
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
    }

    /**
     * Parse <imagelayer id="1" name="foo" locked="1" offsetx="-512" offsety="-512" repeatx="1" repeaty="1">
     */

    parseImageLayer(level, url, node) {
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
    }

    /**
     * Parse <layer id="1" name="foo" width="10" height="20" locked="1">
     */

    parseLayer(level, node) {
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
                'map': create2DArray(arrayContent, parseInt(node.getAttribute('width')))
            };
            if (offsetX !== null) layer.offset.x = offsetX;
            if (offsetY !== null) layer.offset.y = offsetY;
            level.layers.push(layer);
        }
    }

    /**
     * Parse <objectgroup id="1" name="Objects" locked="1">
     */

    parseObjectGroup(level, resources, node) {
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
            const x = parseFloat(obj.getAttribute('x')) * level.scale;
            const y = parseFloat(obj.getAttribute('y')) * level.scale;
            const w = obj.hasAttribute('width') ? parseFloat(obj.getAttribute('width')) * level.scale : 0;
            const h = obj.hasAttribute('height') ? parseFloat(obj.getAttribute('height')) * level.scale : 0;

            // Parse properties
            const properties = parseProperties(obj.querySelector('properties'));

            // Spawn point (direct)
            if (type == 'spawn') {
                this.parseObjectSpawn(level, layer, resources, name, x, y, w, h, properties);
            }

            // Respawn point (random repeatable spawn)
            else if (type == 'respawn') {
                this.parseObjectRespawn(level, layer, resources, name, x, y, w, h, properties);
            }

            // Stairs
            else if (type == 'stairs') {
                this.parseObjectStairs(level, obj, x, y);
            }

            // Portals
            else if (type == 'portal') {
                this.parseObjectPortal(level, obj);
            }

        });
    }

    /**
     * Parse <object id="1" name="foo" type="Spawn" x="10" y="20">
     */

    parseObjectSpawn(level, layer, resources, name, x, y, w, h, properties) {
        // Add point to list of spawnpoints
        if (!(name in level.spawnpoints)) level.spawnpoints[name] = [];
        level.spawnpoints[name].push(new SpawnPoint({x, y, w, h}));

        // Determine URI
        let kindName = '';
        let uri = null;
        
        if ('actor' in properties) {
            kindName = ('type' in properties) ? properties.type : 'actor';
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
                level.spawn({
                    x, y, w, h,
                    type: kindName,
                    layer: layer.name,
                    actor: {
                        xml: (uri in resources.acx) ? resources.acx[uri] : document.getElementById(uri).innerText,
                        properties,
                        scale: level.scale
                    }
                });
            }
        }
    }

    /**
     * Parse <object id="1" name="foo" type="Respawn" x="10" y="20">
     */

    parseObjectRespawn(level, layer, resources, name, x, y, w, h, properties) {
        // Add point to list of spawnpoints
        if (!(name in level.spawnpoints)) level.spawnpoints[name] = [];

        // Determine URI
        let kindName = '';
        let uri = null;

        if ('actor' in properties) {
            kindName = ('type' in properties) ? properties.type : 'actor';
            uri = properties.actor;
        }
        else if (name.search(':') != -1) {
            const twin = name.split(':');
            kindName = twin[0].toLowerCase();
            uri = twin[1];
        }

        // Add respawn info
        if (uri) {
            level.respawnpoints[name] = new RespawnPoint({
                x, y, w, h,
                type: kindName,
                layer: layer.name,
                range: parseIntRange(properties._number),
                actor: {
                    xml: (uri in resources.acx) ? resources.acx[uri] : document.getElementById(uri).innerText,
                    properties,
                    scale: level.scale
                }
            });
        }
    }

    /**
     * Parse <object id="1" name="foo" type="Stairs" x="10" y="20">
     */

    parseObjectStairs(level, node, x, y) {
        const points = node.querySelector('polygon')?.getAttribute('points')?.split(' ');
        const [x1, y1] = points[0].split(',');
        const [x2, y2] = points[1].split(',');
        const [x3, y3] = points[2].split(',');
        const [x4, y4] = points[3].split(',');
        level.stairs.push({
            x1: x + (parseFloat(x1) * level.scale),
            y1: y + (parseFloat(y1) * level.scale),
            x2: x + (parseFloat(x2) * level.scale),
            y2: y + (parseFloat(y2) * level.scale),
            x3: x + (parseFloat(x3) * level.scale),
            y3: y + (parseFloat(y3) * level.scale),
            x4: x + (parseFloat(x4) * level.scale),
            y4: y + (parseFloat(y4) * level.scale)
        });
    }

    /**
     * Parse <object id="1" name="foo" type="Portal" x="10" y="20">
     */

    parseObjectPortal(level, node) {
        const name = node.getAttribute('name');
        if (name.search(':') != -1) {
            const [map, spawn] = name.split(':');
            const x = parseFloat(node.getAttribute('x')) * level.scale;
            const y = parseFloat(node.getAttribute('y')) * level.scale;
            const w = parseFloat(node.getAttribute('width')) * level.scale;
            const h = parseFloat(node.getAttribute('height')) * level.scale;
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

}
