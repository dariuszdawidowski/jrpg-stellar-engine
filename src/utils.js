/*** Generic utils ***/

/**
 * Random int number in range min-max
 */

function randomRangeInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Match with classic asterisk instead of regex
 */

// function matchWithAsterisk(pattern, str) {
//     const parts = pattern.split('*');
//     const start = parts[0];
//     const end = parts[1];

//     if (str.startsWith(start) && str.endsWith(end)) {
//         return true;
//     }

//     return false;
// }

/**
 * Making second path absolute too
 */

function resolvePath(basePath, relativePath) {
    const fakeBaseUrl = 'http://example.com';
    const base = new URL(basePath, fakeBaseUrl);
    const resolved = new URL(relativePath, base);
    return resolved.pathname;
}
