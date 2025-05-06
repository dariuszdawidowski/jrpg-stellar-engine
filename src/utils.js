/*** MATH UTILS ***/

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

/*** PATH UTILS ***/

/**
 * Making second path absolute too
 */

function resolvePath(basePath, relativePath) {
    const fakeBaseUrl = 'http://example.com';
    const base = new URL(basePath, fakeBaseUrl);
    const resolved = new URL(relativePath, base);
    return resolved.pathname;
}

/*** GEOMETRY UTILS ***/

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

