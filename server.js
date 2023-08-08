const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;

const fs = require('fs');

const server = http.createServer((req, res) => {

    // GET
    if (req.method == 'GET') {

        // Log
        console.info('GET:', req.url);

        // Protection
        if (req.url.indexOf('..') != -1) {
            res.statusCode = 400;
            res.end();
        }

        // Public file
        else {
            const filename = `public${req.url == '/' ? '/index.html' : req.url}`;
            fs.readFile(filename, 'utf8', (err, data) => {
                if (!err) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/html');
                    res.end(data);
                }
                else {
                    // Not Found
                    res.statusCode = 404;
                    res.end();
                }
            });
        }
    }

    // Method Not Allowed
    else {
        res.statusCode = 405;
        res.end();
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
