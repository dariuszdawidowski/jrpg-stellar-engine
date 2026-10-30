/**
 * Transform class representing position and rotation
 */

class Transform {

    constructor({ x = 0, y = 0, rotation = { angle: 0, offsetX: 0, offsetY: 0 } }) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
    }

    clear() {
        this.x = 0;
        this.y = 0;
        this.rotation.angle = 0;
        this.rotation.offsetX = 0;
        this.rotation.offsetY = 0;
    }
}