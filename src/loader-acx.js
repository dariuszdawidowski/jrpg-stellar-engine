/**
 * Loads .acx actor xml file
 */

/*

Example #1:

<actor version="0.1" name="chest" type="Actor" resource="#chest" width="32" height="16" cols="2" rows="1">
    <collider x="-4" y="-4" width="24" height="24" />
</actor>

Example #2:

<actor version="0.1" name="penguin1" type="MOB" resource="#mob1" width="88" height="88" cols="4" rows="4">
    <movement speed="80" />
    <collider x="0" y="0" width="22" height="22" />
    <anim name="idle" speed="100">1</anim>
    <anim name="moveUp" speed="100">8, 9, 10</anim>
    <anim name="moveDown" speed="100">0, 1, 2</anim>
    <anim name="moveLeft" speed="100">12, 13, 14</anim>
    <anim name="moveRight" speed="100">4, 5, 6</anim>
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
                if (version && version == '0.1') {
                    const name = actor.getAttribute('name');
                    const type = actor.getAttribute('type');
                    const resource = actor.getAttribute('resource');
                    const width = actor.getAttribute('width');
                    const height = actor.getAttribute('height');
                    const cols = actor.getAttribute('cols');
                    const rows = actor.getAttribute('rows');
                    if (name && type && resource && width && height && cols && rows) {

                        // Base params
                        const params = {
                            name,
                            resource,
                            width: parseInt(width),
                            height: parseInt(height),
                            cols: parseInt(cols),
                            rows: parseInt(rows),
                            scale,
                            transform
                        };

                        // Movement
                        const movement = actor.querySelector('movement');
                        if (movement) {
                            const speed = movement.getAttribute('speed');
                            params['speed'] = parseInt(speed);
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
                                    x: parseInt(colliderX) * scale,
                                    y: parseInt(colliderY) * scale,
                                    width: parseInt(colliderWidth) * scale,
                                    height: parseInt(colliderHeight) * scale
                                };
                            }
                        }

                        // Animations
                        const animations = actor.querySelectorAll('anim');
                        if (animations) {
                            const anim = {};
                            animations.forEach(animation => {
                                const animName = animation.getAttribute('name');
                                const animSpeed = parseInt(animation.getAttribute('speed'));
                                const frames = animation.textContent.split(',').map(Number);
                                anim[animName] = frames;
                                anim['speed'] = animSpeed;
                            });
                            params['anim'] = anim;
                        }

                        // Create and return object
                        const classReference = new Function(`return ${type}`)();
                        if (classReference) return new classReference(params);
                        return new window[type];
                    }
                }
            }

        }

        return null;
    }

}
