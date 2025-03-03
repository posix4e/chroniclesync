const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 59481; // Use the second port provided in the runtime information

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from the extension/dist directory
app.use(express.static(path.join(__dirname, 'extension/dist')));

// Serve settings.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'extension/dist/settings.html'));
});

// Serve specific HTML files
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'extension/dist/settings.html'));
});

app.get('/popup', (req, res) => {
  res.sendFile(path.join(__dirname, 'extension/dist/popup.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, 'extension/dist/history.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Extension server running at http://localhost:${PORT}`);
});