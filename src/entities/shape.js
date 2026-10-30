/**
 * Shape entity
 * Represents a geometric shape with a position, polyline points, and optional properties.
 */

class Shape {

    /**
     * Constructor for the Shape entity
     * @param name: String - name of the shape
     * @param x: Number - x position
     * @param y: Number - y position
     * @param points: Array - polyline points defining the shape
     * @param properties: Object - optional properties for the shape
     */

    constructor({ name, x, y, points, properties = {} } = {}) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.points = points;
        this.properties = properties;
    }

}