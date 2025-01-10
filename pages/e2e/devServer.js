const express = require('express');
const path = require('path');

function createDevServer(port) {
  const app = express();
  const srcPath = path.join(__dirname, '../src');

  // Serve static files from src directory
  app.use(express.static(srcPath));

  // Serve index.html for all routes (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(srcPath, 'index.html'));
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (err) reject(err);
      else resolve(server);
    });
  });
}

module.exports = { createDevServer };