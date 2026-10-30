/**
 * Text entity class
 */

class Text {

    /**
     * Creates a new Text entity
     * @param {string} name - The name of the entity
     * @param {number} x - Center x position
     * @param {number} y - Center y position
     * @param {string} text - The text content
     * @param {string} align - The text alignment
     */

    constructor({ name, x, y, text, align } = {}) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.align = align;
        this.text = text;
    }

}