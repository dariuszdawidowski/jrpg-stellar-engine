class Sprite extends Tile {

    constructor(args) {
        super(args);
        this.transform = {
            x : 0,
            y : 0,
        };
    }

    render() {
        super.render({x: this.transform.x, y: this.transform.y, col: 0, row: 0});
    }

    moveUp(speed) {
        this.transform.y -= speed;
    }

    moveDown(speed) {
        this.transform.y += speed;
    }

    moveRight(speed) {
        this.transform.x += speed;
    }

    moveLeft(speed) {
        this.transform.x -= speed;
    }
}
