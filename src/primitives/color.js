/**
 * Represents a color with red, green, and blue components.
 */

class Color {

    /**
     * Creates a new Color instance.
     * @param {number} r - The red component (0-255).
     * @param {number} g - The green component (0-255).
     * @param {number} b - The blue component (0-255).
     */
    constructor({ r = 0, g = 0, b = 0 } = {}) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

}