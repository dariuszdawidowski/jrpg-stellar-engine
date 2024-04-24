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
     * @param args.scale: float - scale to multiply (default 1)
     * @param args.transform: {x, y} - where to spawn (default 0,0)
     */

    parseActor(args) {

        const { scale = 1, transform = {x: 0, y: 0} } = args;

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
                            scale,
                            transform
                        };
                        const collider = actor.querySelector('collider');
                        if (collider) {
                            const colliderX = collider.getAttribute('x');
                            const colliderY = collider.getAttribute('y');
                            const colliderWidth = collider.getAttribute('width');
                            const colliderHeight = collider.getAttribute('height');
                            if (colliderX && colliderY && colliderWidth && colliderHeight) {
                                params['collider'] = {
                                    x: parseInt(colliderX) * scale,
                                    y: parseInt(colliderY) * scale,
                                    width: parseInt(colliderWidth) * scale,
                                    height: parseInt(colliderHeight) * scale
                                };
                            }
                        }
                        if (type == 'actor') return new Actor(params);
                    }
                }
            }

        }

        return null;
    }

}
