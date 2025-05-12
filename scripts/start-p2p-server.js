import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 12000;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from the dist directory
app.use(express.static(DIST_DIR));

// API endpoint for p2p testing
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'p2p',
    port: PORT,
    timestamp: Date.now()
  });
});

// Serve index.html for all routes to support SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`P2P test server running on http://localhost:${PORT}`);
});