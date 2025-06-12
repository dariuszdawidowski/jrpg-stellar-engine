/****** MATH UTILS ******/

// Global epsilon (bigger than Number.EPSILON)
const EPSILON = 0.00001;

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

function point4Box(point, rect) {
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

/**
 * Check if two rectangles intersect
 * @param {object} a - First rectangle {left, top, right, bottom}
 * @param {object} b - Second rectangle {left, top, right, bottom}
 * @returns {boolean} - True if rectangles intersect
 */

function box4Box(a, b) {
    return !(
        a.right < b.left || 
        a.left > b.right || 
        a.bottom < b.top || 
        a.top > b.bottom
    );
}

/****** PARSE UTILS ******/

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
        let valueCalc = null;
        
        // Convert value based on type
        switch (type) {
            case 'string':
                // Random range (a..b) if needed
                if (value && value.includes('..')) {
                    const [min, max] = value.split('..').map(Number);
                    if (!isNaN(min) && !isNaN(max)) {
                        valueCalc = min + Math.floor(Math.random() * (max - min + 1));
                    }
                }
                // Detect number and convert
                else if (value && /^\d+$/.test(value)) {
                    valueCalc = Number(value);
                }
                // Passthru string
                else {
                    valueCalc = value;
                }
                break;
            case 'bool':
                valueCalc = value === 'true';
                break;
            case 'int':
                valueCalc = parseInt(value, 10);
                break;
            case 'float':
                valueCalc = parseFloat(value);
                break;
        }
        // Original value
        properties['_' + name] = value;
        // Parsed value
        properties[name] = valueCalc;
    });
    return properties;
}

/**
 * Util to parse range 'a..b'
 * @returns 'a..b' == [a, b] | 'a' = [a, a]
 */

function parseIntRange(value) {
    const valueCalc = [0, 0];
    if (value && value.includes('..')) {
        const [min, max] = value.split('..').map(Number);
        if (!isNaN(min) && !isNaN(max)) {
            valueCalc[0] = min;
            valueCalc[1] = max;
        }
    }
    // Detect number and convert
    else if (value && /^\d+$/.test(value)) {
        valueCalc[0] = Number(value);
        valueCalc[1] = Number(value);
    }
    return valueCalc;
}

/**
 * Util to make-a-slug
 * @returns string
 */

function parseSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '');
}