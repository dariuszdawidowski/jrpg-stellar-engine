const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;
const public = 'public';

const fs = require('fs');

function contentType(path) {
    let type = 'unknown';
    switch (path.substring(path.lastIndexOf('.') + 1, path.length)) {
        case 'html':
            type = 'text/html';
            break;
        case 'js':
            type = 'text/javascript';
            break;
        case 'png':
            type = 'image/png';
            break;
    }
    return type;
}

function validPath(path) {
    if (path.indexOf('..') != -1) return false;
    if (contentType(path) == 'unknown') return false;
    return true;
}

const server = http.createServer((req, res) => {

    // GET
    if (req.method == 'GET') {

        // Complete URL
        const url = req.url == '/' ? '/index.html' : req.url;

        // Public file
        if (validPath(url)) {
            fs.readFile(`${public}${url}`, (err, data) => {
                if (!err) {
                    console.info('GET:', url, '200 OK');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', contentType(url));
                    res.end(data);
                }
                else {
                    // Not Found
                    console.info('GET:', url, '404 Not Found');
                    res.statusCode = 404;
                    res.end();
                }
            });
        }
        // Invalid path
        else {
            console.info('GET:', url, '400 Bad Request');
            res.statusCode = 400;
            res.end();
        }

    }

    // Method Not Allowed
    else {
        console.info('?', req.url, '405 Method Not Allowed');
        res.statusCode = 405;
        res.end();
    }

});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
