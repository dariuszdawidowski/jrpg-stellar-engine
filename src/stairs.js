/**
 * Stair for auto moving
 */

class Stairs {

    /**
     * Constructor
     */

    constructor(args) {
        // Coords
        this.x1 = args.x1;
        this.y1 = args.y1;
        this.x2 = args.x2;
        this.y2 = args.y2;
        this.x3 = args.x3;
        this.y3 = args.y3;
        this.x4 = args.x4;
        this.y4 = args.y4;
        // Dimensions
        this.left = 0;
        this.top = 0;
        this.right = 0;
        this.bottom = 0;
        // Precalculated angle (radians)
        this.angle = 0;
        this.precalc();
    }

    /**
     * Precalculate dimensions
     */

    precalc() {
        this.left = Math.min(this.x1, this.x2, this.x3, this.x4);
        this.top = Math.min(this.y1, this.y2, this.y3, this.y4);
        this.right = Math.max(this.x1, this.x2, this.x3, this.x4);
        this.bottom = Math.max(this.y1, this.y2, this.y3, this.y4);
        this.angle = this.calculateTopEdgeAngle();
    }

    /**
     * Util: finding angle of top edge (returning radians directly)
     */

    calculateTopEdgeAngle() {
        const points = [
            { x: this.x1, y: -this.y1 },
            { x: this.x2, y: -this.y2 },
            { x: this.x3, y: -this.y3 },
            { x: this.x4, y: -this.y4 }
        ];

        points.sort((a, b) => {
            if (a.y !== b.y) {
                return a.y - b.y;
            } else {
                return a.x - b.x;
            }
        });

        const [topPoint1, topPoint2] = points.slice(0, 2);

        let leftPoint, rightPoint;
        if (topPoint1.x < topPoint2.x) {
            leftPoint = topPoint1;
            rightPoint = topPoint2;
        } else {
            leftPoint = topPoint2;
            rightPoint = topPoint1;
        }

        const deltaX = rightPoint.x - leftPoint.x;
        const deltaY = rightPoint.y - leftPoint.y;
        
        if (Math.abs(deltaX) < 0.001) {
            return deltaY > 0 ? Math.PI/2 : -Math.PI/2;
        }

        return Math.atan2(deltaY, deltaX);
    }


}
