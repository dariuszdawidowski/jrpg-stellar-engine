class Player extends Sprite {

    constructor(args) {
        super(args);
        this.transform = {
            x : 0,
            y : 0,
            speed : 10
        };
    }

    render() {
        super.render({x: this.transform.x, y: this.transform.y, col: 0, row: 0});
    }

    moveUp() {
        this.transform.y -= this.transform.speed;
    }

    moveDown() {
        this.transform.y += this.transform.speed;
    }

    moveRight() {
        this.transform.x += this.transform.speed;
    }

    moveLeft() {
        this.transform.x -= this.transform.speed;
    }
}
