const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Handle audio requests and static assets like images or CSS.
    if (req.url.startsWith('/audio/')) {
        const filePath = path.join(__dirname, 'public', req.url);
        const ext = path.extname(filePath);
        const mimeTypes = {
            '.mp3': 'audio/mpeg',
            '.opus': 'audio/ogg',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Audio file not found');
                return;
            }

            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Server error while serving audio');
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content);
                }
            });
        });
    } else {
        // Default handling for non-audio requests (e.g., HTML, CSS, etc.)
        let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
        let ext = path.extname(filePath);
        let contentType = 'text/html';

        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.mp3': 'audio/mpeg',
            '.opus': 'audio/ogg',
            '.json': 'application/json'
        };

        if (mimeTypes[ext]) contentType = mimeTypes[ext];

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Page not found');
                return;
            }

            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Server error');
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content);
                }
            });
        });
    }
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
