// Simple Gun relay server for testing
const express = require('express');
const Gun = require('gun');
const cors = require('cors');

const app = express();
app.use(cors());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Create a Gun instance
const gun = Gun({
  web: app.listen(8765)
});

console.log('Gun relay server running on port 8765');