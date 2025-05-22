/**
 * Loads .acx actor xml file
 */

/*

Example #1:

<actor version="0.4" name="chest" class="Actor" resource="#chest" width="32" height="16" cols="2" rows="1">
    <collider x="-4" y="-4" width="24" height="24" />
</actor>

Example #2:

<actor version="0.4" name="penguin1" class="MOB" resource="#mob1" width="88" height="88" cols="4" rows="4">
    <properties>
        <property name="spd" value="80"/>
        <property name="foo" value="bar"/>
    </properties>
    <collider x="0" y="0" width="22" height="22"/>
    <animation name="idle">
        <frame tileid="1" duration="100"/>
    </animation>
    <animation name="moveUp">
        <frame tileid="8" duration="100"/>
        <frame tileid="9" duration="100"/>
        <frame tileid="10" duration="100"/>
    </animation>
    <animation name="moveDown">
        <frame tileid="0" duration="100"/>
        <frame tileid="1" duration="100"/>
        <frame tileid="2" duration="100"/>
    </animation>
    <animation name="moveLeft">
        <frame tileid="12" duration="100"/>
        <frame tileid="13" duration="100"/>
        <frame tileid="14" duration="100"/>
    </animation>
    <animation name="moveRight">
        <frame tileid="4" duration="100"/>
        <frame tileid="5" duration="100"/>
        <frame tileid="6" duration="100"/>
    </animation>
</actor>

*/

class LoaderACX {

    /**
     * Parse xml
     * @param args.id: string - optional unique id for an actor
     * @param args.xml: string - xml to parse
     * @param args.scale: float - scale to multiply (default 1)
     * @param args.transform: {x, y} - where to spawn (default 0,0)
     * @param args.properties: custom properties
     */

    parseActor(args) {

        const { scale = 1, transform = {x: 0, y: 0} } = args;

        if ('xml' in args) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(args.xml, 'application/xml');
            const actor = doc.querySelector('actor');
            if (actor) {
                // Parse all data
                const params = this.parseData({actor, scale, transform});
                // Create and return object
                if (params) return this.createActor(params);
            }
        }

        return null;
    }

    /**
     * Change xml string to serialized actor data
     */

    parseData(args) {
        const { actor, scale, transform } = args;
        const version = actor.getAttribute('version');
        if (version && (version == '0.2' || version == '0.3' || version == '0.4')) {
            const name = actor.getAttribute('name');
            const className = (version == '0.4') ? actor.getAttribute('class') : actor.getAttribute('type');
            const resource = actor.getAttribute('resource');
            const width = actor.getAttribute('width');
            const height = actor.getAttribute('height');
            const cols = actor.getAttribute('cols');
            const rows = actor.getAttribute('rows');
            if (name && className && resource && width && height && cols && rows) {

                // Base params
                const params = {
                    className,
                    name,
                    resource,
                    width: parseInt(width),
                    height: parseInt(height),
                    cols: parseInt(cols),
                    rows: parseInt(rows),
                    scale,
                    transform,
                };

                // Optional ID
                if ('id' in args) params['id'] = args.id;
                // Optional type
                if ('type' in args) params['type'] = args.type;

                // Properties (v0.3)
                const acxProperties = parseProperties(actor.querySelector('properties'));
                const tmxProperties = ('properties' in args) ? args.properties : {};
                params['properties'] = {...acxProperties, ...tmxProperties};

                // Movement (v0.2)
                const movement = actor.querySelector('movement');
                if (movement) {
                    const speed = movement.getAttribute('speed');
                    if (speed) params['properties']['spd'] = parseInt(speed);
                }

                // Collider
                const collider = actor.querySelector('collider');
                if (collider) {
                    const colliderX = collider.getAttribute('x');
                    const colliderY = collider.getAttribute('y');
                    const colliderWidth = collider.getAttribute('width');
                    const colliderHeight = collider.getAttribute('height');
                    if (colliderX && colliderY && colliderWidth && colliderHeight) {
                        params['collider'] = {
                            x: parseInt(colliderX),
                            y: parseInt(colliderY),
                            width: parseInt(colliderWidth),
                            height: parseInt(colliderHeight)
                        };
                    }
                }

                // Animations
                const animations = actor.querySelectorAll('animation');
                if (animations) {
                    const anim = {};
                    animations.forEach(animation => {
                        const animName = animation.getAttribute('name');
                        anim[animName] = [];
                        const frames = animation.querySelectorAll('frame');
                        frames.forEach(frame => {
                            const tileId = frame.getAttribute('tileid');
                            const duration = frame.getAttribute('duration');
                            anim[animName].push({frame: tileId, duration});
                        });
                    });
                    params['animations'] = anim;
                }

                return params;
            }
        }
        else {
            console.error('Unreckognized ACX format')
        }
    }

    /**
     * Create an actor from serialized data (see actor.js:serialize())
     */

    createActor(params) {
        // Precalculate values
        if ('spd' in params['properties']) params['properties']['spd'] *= params.scale;
        if ('collider' in params) params['collider'] = {
            x: params['collider'].x * params.scale,
            y: params['collider'].y * params.scale,
            width: params['collider'].width * params.scale,
            height: params['collider'].height * params.scale
        };

        // Create instance
        const classReference = new Function(`return ${params.className}`)();
        if (classReference) return new classReference(params);
        return new window[params.className];
    }


}
