const http = require('http');
const fs = require('fs');
const path = require('path');

function createDevServer(port) {
  const server = http.createServer((req, res) => {
    // Serve index.html for all routes
    const filePath = path.join(__dirname, '../src/index.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(port, (err) => {
      if (err) reject(err);
      else resolve(server);
    });
  });
}

module.exports = { createDevServer };