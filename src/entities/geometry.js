/**
 * Geometry represents a custom geometric shape in the game world.
 * It can be a point or an ellipse with associated properties.
 */

class Geometry {

    /**
     * Creates a new Geometry instance.
     * @param {Object} options - Options for the shape.
     * @param {string} options.type - Type of the shape ('point' or 'ellipse').
     * @param {string} options.name - Name of the shape.
     * @param {number} options.x - X coordinate.
     * @param {number} options.y - Y coordinate.
     * @param {number} [options.w=null] - Width of the shape (for ellipse).
     * @param {number} [options.h=null] - Height of the shape (for ellipse).
     * @param {Object} [options.properties={}] - Additional properties.
     */

    constructor({ type, name, x, y, w = null, h = null, properties = {} } = {}) {
        this.type = type;
        this.name = name;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.cx = w ? x + (w / 2) : x;
        this.cy = h ? y + (h / 2) : y;
        this.properties = properties;
    }

}