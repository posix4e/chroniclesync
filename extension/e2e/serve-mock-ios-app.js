const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Serve the mock iOS app HTML
  if (req.url === '/mock-ios-app.html' || req.url === '/') {
    fs.readFile(path.join(__dirname, 'test-pages', 'mock-ios-app.html'), (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading mock-ios-app.html: ${err.message}`);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }
  
  // Handle 404
  res.writeHead(404);
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`Mock iOS app server running at http://localhost:${port}/mock-ios-app.html`);
});