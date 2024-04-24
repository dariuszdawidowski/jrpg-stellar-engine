/**
 * Loads .acx actor xml file
 */

/*

Example:

<actor version="1.0" name="chest" type="actor" resource="#chest" width="32" height="16" cols="2" rows="1">
    <collider x="-4" y="-4" width="24" height="24" />
</actor>

*/

class LoaderACX {

    /**
     * Parse xml
     * @param args.xml: string - xml to parse
     */

    parseActor(args) {

        if ('xml' in args) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(args.xml, 'application/xml');
            const actor = doc.querySelector('actor');
            if (actor) {
                const version = actor.getAttribute('version');
                if (version && version == '1.0') {
                    const name = actor.getAttribute('name');
                    const type = actor.getAttribute('type');
                    const resource = actor.getAttribute('resource');
                    const width = actor.getAttribute('width');
                    const height = actor.getAttribute('height');
                    const cols = actor.getAttribute('cols');
                    const rows = actor.getAttribute('rows');
                    if (name && type && resource && width && height && cols && rows) {
                        const params = {
                            resource,
                            width: parseInt(width),
                            height: parseInt(height),
                            cols: parseInt(cols),
                            rows: parseInt(rows),
                            scale: args.scale,
                        };
                        const collider = actor.querySelector('collider');
                        if (collider) {
                            const colliderX = collider.getAttribute('x');
                            const colliderY = collider.getAttribute('y');
                            const colliderWidth = collider.getAttribute('width');
                            const colliderHeight = collider.getAttribute('height');
                            if (colliderX && colliderY && colliderWidth && colliderHeight) {
                                params['collider'] = {
                                    x: parseInt(colliderX) * args.scale,
                                    y: parseInt(colliderY) * args.scale,
                                    width: parseInt(colliderWidth) * args.scale,
                                    height: parseInt(colliderHeight) * args.scale
                                };
                            }
                        }
                        if ('transform' in args) params['transform'] = args.transform;
                        if (type == 'actor') return new Actor(params);
                    }
                }
            }

        }

        return null;
    }

}
