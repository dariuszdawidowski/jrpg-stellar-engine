/**
 * A* Pathfinding system
 * Uses level collision data for obstacle detection
 */

class Pathfinder {

    /**
     * Constructor
     * @param {Number} args.gridSize - Grid size for pathfinding
     * @param {Number} args.maxSearchDistance - Maximum search distance for pathfinding
     */

    constructor(args) {
        this.gridSize = args.gridSize || 16;
        this.maxSearchDistance = args.maxSearchDistance || 1000;
        this.debugPoints = [];
        this.debugRaycast = {
            start: {x: 0, y: 0},
            end:  {x: 0, y: 0}
        };
        // Current search state (between findPath calls)
        this.search = null;
    }

    /**
     * Find optimal path between two points
     * @param {object} start - Starting position {x, y}
     * @param {object} end - Ending position {x, y}
     * @param {Array} colliders - List of level's colliders
     * @param {Number} steps - Maximum number of A* nodes processed in one call
     * @returns {array|null} - Array of path nodes or null if path not found
     */

    findPath(start, end, colliders, steps = 100) {

        const startX = Math.floor(start.x / this.gridSize);
        const startY = Math.floor(start.y / this.gridSize);
        const endX = Math.floor(end.x / this.gridSize);
        const endY = Math.floor(end.y / this.gridSize);
        const hasNewSearch = !this.search
            || this.search.startX !== startX
            || this.search.startY !== startY
            || this.search.endX !== endX
            || this.search.endY !== endY;

        if (hasNewSearch) {
            this.debugPoints = [];

            const finalTarget = this._findNearestAccessiblePoint(end, colliders);
            if (!finalTarget) {
                this.search = {
                    startX,
                    startY,
                    endX,
                    endY,
                    colliders,
                    complete: true,
                    path: null
                };
                return null;
            }

            const finalEndX = Math.floor(finalTarget.x / this.gridSize);
            const finalEndY = Math.floor(finalTarget.y / this.gridSize);
            const startNode = {
                x: startX,
                y: startY,
                g: 0,
                h: 0,
                f: 0,
                parent: null
            };
            const endNode = {x: finalEndX, y: finalEndY};
            const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

            this.search = {
                startX,
                startY,
                endX,
                endY,
                colliders,
                startNode,
                endNode,
                openList: [startNode],
                closedList: [],
                nodeMap: {[`${startNode.x},${startNode.y}`]: startNode},
                closestNode: startNode,
                closestDistance: heuristic(startNode, endNode),
                complete: false,
                path: null
            };
        }

        if (this.search.complete) return this.search.path;

        const searchSteps = Math.max(1, Math.floor(steps));
        const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        const neighbors = [
            {x: -1, y: 0},
            {x: 1, y: 0},
            {x: 0, y: -1},
            {x: 0, y: 1},
            {x: -1, y: -1},
            {x: 1, y: -1},
            {x: -1, y: 1},
            {x: 1, y: 1}
        ];

        for (let step = 0; step < searchSteps && this.search.openList.length > 0; step++) {
            let currentIndex = 0;
            let currentNode = this.search.openList[0];

            for (let index = 1; index < this.search.openList.length; index++) {
                if (this.search.openList[index].f < currentNode.f) {
                    currentNode = this.search.openList[index];
                    currentIndex = index;
                }
            }

            this.search.openList.splice(currentIndex, 1);
            this.search.closedList.push(currentNode);

            if (currentNode.x === this.search.endNode.x && currentNode.y === this.search.endNode.y) {
                this.search.path = this._buildPath(currentNode);
                this.search.complete = true;
                return this.search.path;
            }

            const currentDistance = heuristic(currentNode, this.search.endNode);
            if (currentDistance < this.search.closestDistance) {
                this.search.closestNode = currentNode;
                this.search.closestDistance = currentDistance;
            }

            for (const dir of neighbors) {
                const neighborPos = {
                    x: currentNode.x + dir.x,
                    y: currentNode.y + dir.y
                };

                if (Math.abs(neighborPos.x - this.search.startNode.x) * this.gridSize > this.maxSearchDistance
                    || Math.abs(neighborPos.y - this.search.startNode.y) * this.gridSize > this.maxSearchDistance) {
                    continue;
                }

                const worldPos = {
                    x: neighborPos.x * this.gridSize + this.gridSize / 2,
                    y: neighborPos.y * this.gridSize + this.gridSize / 2
                };
                const collisionSize = this.gridSize * 0.7;
                const neighborRect = {
                    left: worldPos.x - collisionSize / 2,
                    top: worldPos.y - collisionSize / 2,
                    right: worldPos.x + collisionSize / 2,
                    bottom: worldPos.y + collisionSize / 2
                };
                const hasCollision = colliders.some(collider => box4Box(neighborRect, collider));
                if (hasCollision || this.search.closedList.some(node => node.x === neighborPos.x && node.y === neighborPos.y)) continue;

                const neighborKey = `${neighborPos.x},${neighborPos.y}`;
                let neighborNode = this.search.nodeMap[neighborKey];
                const gScore = currentNode.g + (dir.x !== 0 && dir.y !== 0 ? 1.4 : 1);

                if (!neighborNode || gScore < neighborNode.g) {
                    if (!neighborNode) {
                        neighborNode = {x: neighborPos.x, y: neighborPos.y, parent: currentNode};
                        this.search.nodeMap[neighborKey] = neighborNode;
                        this.search.openList.push(neighborNode);
                    }
                    else {
                        neighborNode.parent = currentNode;
                    }

                    neighborNode.g = gScore;
                    neighborNode.h = heuristic(neighborNode, this.search.endNode);
                    neighborNode.f = neighborNode.g + neighborNode.h;
                }
            }
        }

        if (this.search.openList.length === 0) {
            this.search.complete = true;

            if (this.search.closestNode !== this.search.startNode) {
                this.search.path = this._buildPath(this.search.closestNode);
                return this.search.path;
            }
        }

        return null;
    }

    /**
     * Build a world-coordinate path from the completed A* node
     * @param {object} node - Final A* node
     * @returns {Array}
     */

    _buildPath(node) {
        const path = [];
        let current = node;

        while (current !== null) {
            path.push({
                x: current.x * this.gridSize + this.gridSize / 2,
                y: current.y * this.gridSize + this.gridSize / 2
            });
            current = current.parent;
        }

        return path.reverse();
    }

    /**
     * Find nearest accessible point if target is inside a collider
     * @param {object} target - Target position {x, y}
     * @param {Array} colliders - List of level's colliders
     * @returns {object|null} - Nearest accessible point or null if none found
     */

    _findNearestAccessiblePoint(target, colliders) {
        const getGridPoint = point => ({
            x: Math.floor(point.x / this.gridSize) * this.gridSize + this.gridSize / 2,
            y: Math.floor(point.y / this.gridSize) * this.gridSize + this.gridSize / 2
        });
        const targetGridPoint = getGridPoint(target);

        // A* navigates to grid centers, so validate the same point here.
        if (!this._isPointBlocked(targetGridPoint, colliders)) return targetGridPoint;
        
        // Search parameters
        const maxRadius = 200; // Maximum search radius
        const stepSize = this.gridSize; // Step size between test points
        
        // Search in increasing radius
        for (let radius = stepSize; radius <= maxRadius; radius += stepSize) {
            // Test points in a circle
            const angleStep = Math.PI / 8; // Every 22.5 degrees
            
            for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
                const testPoint = {
                    x: target.x + Math.cos(angle) * radius,
                    y: target.y + Math.sin(angle) * radius
                };
                const gridPoint = getGridPoint(testPoint);

                if (!this._isPointBlocked(gridPoint, colliders)) return gridPoint;
            }
        }
        
        return null; // No accessible point found
    }

    /**
     * Check if point is blocked by any collider
     * @param {object} point - Point to check {x, y}
     * @param {Array} colliders - List of colliders
     * @returns {boolean} - True if point is blocked
     */

    _isPointBlocked(point, colliders) {
        const testSize = this.gridSize * 0.7;
        const testRect = {
            left: point.x - testSize / 2,
            top: point.y - testSize / 2,
            right: point.x + testSize / 2,
            bottom: point.y + testSize / 2
        };
        
        for (const collider of colliders) {
            if (box4Box(testRect, collider)) {
                this.debugPoints.push({...point, blocked: true});
                return true;
            }
        }
        
        this.debugPoints.push({...point, blocked: false});
        return false;
    }

    /**
     * Raycast with colliders
     * @param {object} point - Starting point {x, y}
     * @param {object} vector - Direction vector {x, y}
     * @param {Array} colliders - List of colliders
     * @returns {object} - Intersection point {x, y} offset by gridSize or point at maxDistance if no intersection
     */

    raycast(point, vector, colliders) {
        // Normalize the vector (make it unit length)
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length === 0) return {...point}; // Return copy of start point if vector is zero
        
        const dirX = vector.x / length;
        const dirY = vector.y / length;
        
        // Maximum ray distance
        const maxDistance = 10000;
        
        // For storing the closest intersection
        let closestDist = maxDistance;
        let closestPoint = null;
        
        // Check intersection with each collider
        for (const collider of colliders) {
            // Calculate intersection with each edge of the rectangle
            
            // Top edge
            const t1 = this._lineIntersection(
                point.x, point.y, 
                point.x + dirX * maxDistance, point.y + dirY * maxDistance,
                collider.left, collider.top, 
                collider.right, collider.top
            );
            
            // Right edge
            const t2 = this._lineIntersection(
                point.x, point.y, 
                point.x + dirX * maxDistance, point.y + dirY * maxDistance,
                collider.right, collider.top, 
                collider.right, collider.bottom
            );
            
            // Bottom edge
            const t3 = this._lineIntersection(
                point.x, point.y, 
                point.x + dirX * maxDistance, point.y + dirY * maxDistance,
                collider.left, collider.bottom, 
                collider.right, collider.bottom
            );
            
            // Left edge
            const t4 = this._lineIntersection(
                point.x, point.y, 
                point.x + dirX * maxDistance, point.y + dirY * maxDistance,
                collider.left, collider.top, 
                collider.left, collider.bottom
            );
            
            // Find closest valid intersection
            const intersections = [t1, t2, t3, t4].filter(t => t !== null && t >= 0 && t < closestDist);
            
            if (intersections.length > 0) {
                const minT = Math.min(...intersections);
                if (minT < closestDist) {
                    closestDist = minT;
                    
                    // Calculate exact intersection point
                    const hitX = point.x + dirX * minT;
                    const hitY = point.y + dirY * minT;
                    
                    // Move back by gridSize from the intersection point (away from the collider)
                    // Ensure we don't go past the start point
                    const offsetDist = Math.min(minT, this.gridSize);
                    closestPoint = {
                        x: hitX - dirX * offsetDist,
                        y: hitY - dirY * offsetDist
                    };
                }
            }
        }
        
        // If no intersection found, return point at maxDistance in the ray direction
        if (!closestPoint) {
            closestPoint = {
                x: point.x + dirX * maxDistance,
                y: point.y + dirY * maxDistance
            };
        }
        
        // Set debug info for visualization
        this.debugRaycast.start.x = point.x;
        this.debugRaycast.start.y = point.y;
        this.debugRaycast.end.x = closestPoint.x;
        this.debugRaycast.end.y = closestPoint.y;

        return closestPoint;
    }
    
    /**
     * Helper function for line-segment intersection calculation
     * @private
     */
    _lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Calculate denominators
        const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        
        // Lines are parallel or coincident
        if (den === 0) return null;
        
        // Calculate intersection parameters
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;
        
        // Check if intersection is within both line segments
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            // Return distance along ray
            return ua * Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        }
        
        return null;
    }

    /**
     * Draw the shared pathfinding grid for debugging
     * @param {View} view - View to draw on
     */

    static debugGrid(view, gridSize = 20, color = 'rgba(255, 255, 0, 0.3)') {
        view.ctx.save();

        const topLeft = view.screen2World({x: 0, y: 0});
        const bottomRight = view.screen2World({x: view.canvas.width, y: view.canvas.height});
        const firstGridX = Math.floor(topLeft.x / gridSize) * gridSize;
        const firstGridY = Math.floor(topLeft.y / gridSize) * gridSize;

        view.ctx.strokeStyle = color;
        view.ctx.lineWidth = 1;
        view.ctx.beginPath();

        for (let x = firstGridX; x <= bottomRight.x; x += gridSize) {
            const lineStart = view.world2Screen({x, y: topLeft.y});
            const lineEnd = view.world2Screen({x, y: bottomRight.y});
            view.ctx.moveTo(lineStart.x, lineStart.y);
            view.ctx.lineTo(lineEnd.x, lineEnd.y);
        }

        for (let y = firstGridY; y <= bottomRight.y; y += gridSize) {
            const lineStart = view.world2Screen({x: topLeft.x, y});
            const lineEnd = view.world2Screen({x: bottomRight.x, y});
            view.ctx.moveTo(lineStart.x, lineStart.y);
            view.ctx.lineTo(lineEnd.x, lineEnd.y);
        }

        view.ctx.stroke();
        view.ctx.restore();
    }

    /**
     * Optional: Draw path for debugging
     * @param {View} view - View to draw on
     * @param {Array} path - Path nodes to draw
     * @param {string} color - Color for path visualization
     */

    debug(view, path, color = 'rgb(255, 200, 0)') {

        view.ctx.save();

        // Draw points searching closest available point
        this.debugPoints.forEach(point => {
            if (point.blocked) view.ctx.strokeStyle = 'rgb(255, 200, 0)';
            else view.ctx.strokeStyle = 'rgb(0, 255, 0)';
            const testPoint = view.world2Screen(point);
            view.ctx.beginPath();
            view.ctx.arc(testPoint.x, testPoint.y, 4, 0, Math.PI * 2);
            view.ctx.stroke();
        });

        // Draw raycast ray
        if (this.debugRaycast.start && this.debugRaycast.end) {
            view.ctx.strokeStyle = 'rgb(255, 100, 100)'; // Red for ray
            view.ctx.lineWidth = 2;
            view.ctx.beginPath();
            
            const rayStart = view.world2Screen(this.debugRaycast.start);
            const rayEnd = view.world2Screen(this.debugRaycast.end);
            
            view.ctx.moveTo(rayStart.x, rayStart.y);
            view.ctx.lineTo(rayEnd.x, rayEnd.y);
            view.ctx.stroke();
            
            // Draw intersection point
            view.ctx.fillStyle = 'rgb(255, 100, 100)';
            view.ctx.beginPath();
            view.ctx.arc(rayEnd.x, rayEnd.y, 5, 0, Math.PI * 2);
            view.ctx.fill();
        }
        

        // Navigation path
        if (!path || path.length < 2) {
            view.ctx.restore();
            return;
        }
        
        // Draw line connecting path nodes
        view.ctx.strokeStyle = color;
        view.ctx.lineWidth = 2;
        view.ctx.beginPath();
        
        const firstPoint = view.world2Screen(path[0]);
        view.ctx.moveTo(firstPoint.x, firstPoint.y);
        
        // Connect all points
        for (let i = 1; i < path.length; i++) {
            const point = view.world2Screen(path[i]);
            view.ctx.lineTo(point.x, point.y);
        }
        
        view.ctx.stroke();
        
        // Draw nodes as small circles
        view.ctx.fillStyle = color;
        for (const point of path) {
            const screenPos = view.world2Screen(point);
            view.ctx.beginPath();
            view.ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
            view.ctx.fill();
        }
        
        view.ctx.restore();
    }

    /**
     * Checks if the character can stand on a given point (considering the character's size)
     * @param {object} point - {x, y}
     * @param {Array} colliders
     * @param {object} characterBox - {width, height}
     * @returns {boolean}
     */
    
    canFit(point, colliders, characterBox) {
        const testRect = {
            left: point.x - characterBox.width / 2,
            top: point.y - characterBox.height / 2,
            right: point.x + characterBox.width / 2,
            bottom: point.y + characterBox.height / 2
        };
        for (const collider of colliders) {
            if (box4Box(testRect, collider)) return false;
        }
        return true;
    }

    /**
     * Reset the pathfinder's search state
     * This should be called when the character is removed or reset to avoid stale search data
     * @returns {void}
     */

    reset() {
        this.search = null;
        this.debugPoints = [];
    }    
}