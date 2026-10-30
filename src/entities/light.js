/**
 * Base light
 */

class Light {

    /**
     * Creates a new light instance
     * @param {Color} color - Red, green, and blue components of the light color
     */

    constructor({ color = new Color({ r: 255, g: 255, b: 255 }) } = {}) {
        this.color = color;
    }

}

/**
 * Ambient light
 */

class AmbientLight extends Light {

    /**
     * Creates a new ambient light instance
     * @param {Color} color - Red, green, and blue components of the light color
     * @param {boolean} baked - Whether the ambient light is static (baked) or dynamic
     */

    constructor({ color = new Color({ r: 255, g: 255, b: 255 }), baked = false } = {}) {
        super({ color });
        this.baked = baked;
    }

}

/**
 * Point light
 */

class PointLight extends Light {

    /**
     * Creates a new point light instance
     * @param {float} x - X coordinate of the point light
     * @param {float} y - Y coordinate of the point light
     * @param {number} radius - Radius of the point light
     * @param {Color} color - Red, green, and blue components of the light color
     * @param {number} intensity - Intensity of the point light
     * @param {Object} dither - Dither settings for the point light
     * @param {number} dither.size - Dither size
     * @param {number} dither.edge - Dither edge
     */

    constructor({ x = 0, y = 0, radius = 100, color = new Color({ r: 255, g: 255, b: 255 }), intensity = 1.0, dither = { size: 2, edge: 0.7 } } = {}) {
        super({ color });
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.intensity = intensity;
        this.dither = dither;
    }

}

/**
 * Spot light
 */

class SpotLight extends PointLight {

    /**
     * Creates a new spot light instance
     * @param {float} x - X coordinate of the spot light
     * @param {float} y - Y coordinate of the spot light
     * @param {number} radius - Radius of the spot light
     * @param {number} angle - Angle of the spot light
     * @param {number} width - Width of the spot light
     * @param {number} cone - Cone of the spot light
     * @param {Color} color - Red, green, and blue components of the light color
     * @param {number} intensity - Intensity of the spot light
     * @param {Object} dither - Dither settings for the spot light
     * @param {number} dither.size - Dither size
     * @param {number} dither.edge - Dither edge
     */

    constructor({ x = 0, y = 0, radius = 100, angle = 90, width = 40, cone = 100, color = new Color({ r: 255, g: 255, b: 255 }), intensity = 1.0, dither = { size: 2, edge: 0.7 } } = {}) {
        super({ x, y, radius, color, intensity, dither });
        this.angle = angle;
        this.width = width;
        this.cone = cone;
    }
}
