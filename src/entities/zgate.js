/**
 * Class representing a ZGate entity.
 */
/**
 * @param {string} name - The name of the ZGate.
 * @param {string} layer - Working layer of the ZGate.
 * @param {number} anchorY - Seam line an actor's baseline must cross to be drawn above this cover layer, defaults to the gate's bottom edge.
 * @param {string} scope - 'actor' | 'mount:slot'
 * @param {string[]} include - Optional actor type filters (actor.type), null when not set
 * @param {string[]} exclude - Optional list of excluded actor types, null when not set.
 * @param {number} left - The left boundary.
 * @param {number} top - The top boundary.
 * @param {number} right - The right boundary.
 * @param {number} bottom - The bottom boundary.
 */

class ZGate {

    constructor({ name, layer, anchorY = 0, scope = 'actor', include = null, exclude = null, left, top, right, bottom }) {
        this.name = name;
        this.layer = layer;
        this.anchorY = anchorY;
        this.scope = scope;
        this.include = include;
        this.exclude = exclude;
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }

}