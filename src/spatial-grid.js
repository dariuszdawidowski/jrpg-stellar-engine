/**
 * Spatial hash for broad-phase rectangle queries
 */

class SpatialGrid {

    constructor(colliders = [], cellSize = 64) {
        if (!Number.isFinite(cellSize) || cellSize <= 0) {
            throw new RangeError('SpatialGrid cellSize must be a positive finite number');
        }

        this.cellSize = cellSize;
        this.colliders = [];
        this.cells = new Map();
        this.rebuild(colliders);
    }

    rebuild(colliders) {
        this.cells.clear();
        this.colliders = colliders;

        for (let index = 0; index < colliders.length; index++) {
            const collider = colliders[index];
            const minX = Math.floor(collider.left / this.cellSize);
            const maxX = Math.floor(collider.right / this.cellSize);
            const minY = Math.floor(collider.top / this.cellSize);
            const maxY = Math.floor(collider.bottom / this.cellSize);

            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const key = `${x},${y}`;
                    let bucket = this.cells.get(key);
                    if (!bucket) {
                        bucket = [];
                        this.cells.set(key, bucket);
                    }
                    bucket.push(index);
                }
            }
        }
    }

    query(rect) {
        const minX = Math.floor(rect.left / this.cellSize);
        const maxX = Math.floor(rect.right / this.cellSize);
        const minY = Math.floor(rect.top / this.cellSize);
        const maxY = Math.floor(rect.bottom / this.cellSize);
        const indices = new Set();

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const bucket = this.cells.get(`${x},${y}`);
                if (bucket) {
                    for (const index of bucket) indices.add(index);
                }
            }
        }

        return Array.from(indices)
            .sort((a, b) => a - b)
            .map(index => this.colliders[index]);
    }
}