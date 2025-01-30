const express = require('express');
const cors = require('cors');
const app = express();
const port = 53540;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ healthy: true });
});

app.post('/history', (req, res) => {
  res.json({ success: true });
});

app.get('/history/:clientId', (req, res) => {
  res.json({
    history: [
      { url: 'https://example.com', timestamp: Date.now() }
    ]
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Mock server running at http://localhost:${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is already in use, assuming mock server is already running`);
  } else {
    console.error('Error starting mock server:', err);
    process.exit(1);
  }
});