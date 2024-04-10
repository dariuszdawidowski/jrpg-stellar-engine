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
     */

    parseLevel(xmlStr, scale = 1) {

        // Parse XML
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlStr, 'application/xml');

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
                        level.tilesets[tilesetName] = {ref: this.tilesets[tilesetName], first: tilesetFirst};
                        break;

                    // Layer
                    case 'layer':
                        const name = node.getAttribute('name').toLowerCase();
                        const cl = node.hasAttribute('class') ? node.getAttribute('class').toLowerCase() : '';
                        const data = node.querySelector('data');
                        if (data) {
                            const arrayContent = data.textContent.split(',').map(Number);
                            level.layers.push({
                                'name': name,
                                'class': cl,
                                'map': this.create2DArray(arrayContent, parseInt(node.getAttribute('width')))
                            });
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
