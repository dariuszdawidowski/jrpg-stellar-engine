/****** MATH UTILS ******/

/**
 * Random int number in range min-max
 */

function randomRangeInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Random float number in range min-max
 */

function randomRangeFloat(min, max) {
    return Math.random() * (max - min) + min;
};

/**
 * Round number to nearest even
 * @param number: Number - value to round
 */

function roundToNearestEven(number) {
    let roundedNumber = Math.round(number);
    if (roundedNumber % 2 !== 0) roundedNumber += 1;
    return roundedNumber;
}

/**
 * Util to generate 2d array
 * @param arr: Array
 * @param width: Number
 */

function create2DArray(arr, width) {
    let result = [];
    for (let i = 0; i < arr.length; i += width) {
        result.push(arr.slice(i, i + width));
    }
    return result;
}


/****** URL UTILS ******/

/**
 * Making second path absolute too
 */

function resolvePath(basePath, relativePath) {
    const fakeBaseUrl = 'http://example.com';
    const base = new URL(basePath, fakeBaseUrl);
    const resolved = new URL(relativePath, base);
    return resolved.pathname;
}

/****** GEOMETRY UTILS ******/

/**
 * Checking collision
 * @param point {x: Number, y: Number}
 * @param rect {left: Number, right: Number, top: Number, bottom: Number}
 */

function pointInRect(point, rect) {
    return point.x >= rect.left && 
        point.x <= rect.right && 
        point.y >= rect.top && 
        point.y <= rect.bottom;
}

/**
 * Angle between two points
 * @param point1 {x: Number, y: Number}
 * @param point2 {x: Number, y: Number}
 * @returns angle: Number (degrees 0..359, 0=north, clockwise) 
 */

function anglePoints(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    angle = (angle + 90) % 360;
    if (angle < 0) angle += 360;
    return angle;
}

/**
 * Distance between two points
 * @param point1 {x: Number, y: Number}
 * @param point2 {x: Number, y: Number}
 * @returns distance: Number
 */

function distancePoints(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/****** XML UTILS ******/

/**
 * Util to parse properties
 */

function parseProperties(propertiesNode) {
    // Data
    const properties = {};
    // Iterate properties
    if (propertiesNode) propertiesNode.querySelectorAll('property').forEach(prop => {

        // Attributes
        const name = prop.getAttribute('name').toLowerCase();
        const type = prop.getAttribute('type') || 'string';
        let value = prop.getAttribute('value');
        
        // Convert value based on type
        switch (type) {
            case 'string':
                // Random range (a..b) if needed
                if (value && value.includes('..')) {
                    const [min, max] = value.split('..').map(Number);
                    if (!isNaN(min) && !isNaN(max)) {
                        value = min + Math.floor(Math.random() * (max - min + 1));
                    }
                }
                // Detect number and convert
                if (value && /^\d+$/.test(value)) {
                    value = Number(value);
                }
                break;
            case 'bool':
                value = value === 'true';
                break;
            case 'int':
                value = parseInt(value, 10);
                break;
            case 'float':
                value = parseFloat(value);
                break;
        }
        
        properties[name] = value;
    });
    return properties;
}
