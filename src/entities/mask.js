/**
 * Mask class for defining collision masks.
 */

class Mask {

    /**
     * Creates a new Mask instance.
     * @param {string} name - The name of the mask.
     * @param {number} x - Center x coordinate of the mask.
     * @param {number} y - Center y coordinate of the mask.
     * @param {number} left - The left coordinate of the mask.
     * @param {number} top - The top coordinate of the mask.
     * @param {number} right - The right coordinate of the mask.
     * @param {number} bottom - The bottom coordinate of the mask.
     */

    constructor({ name, x, y, radius, left, top, right, bottom }) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }

    /**
     * Returns mask in world coords
     * @param extend: Number - how many pixels to extend the mask in all directions
     * @returns {left, top, right, bottom}: Direction vector
     */

    getMask(extend = 0) {
        return {
            left: this.left - extend,
            top: this.top - extend,
            right: this.right + extend,
            bottom: this.bottom + extend
        };
    }

}