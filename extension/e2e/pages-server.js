import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 52285;

// Enable CORS for all routes
app.use(cors());

// Mock history data
let historyData = [];

// Endpoint to get history
app.get('/pages', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ChronicleSync History</title>
        <style>
          .history-entry {
            padding: 10px;
            border: 1px solid #ddd;
            margin: 10px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <h1>Browsing History</h1>
        <div id="history-list">
          ${historyData.map(entry => `
            <div class="history-entry">
              <div><strong>URL:</strong> ${entry.url}</div>
              <div><strong>Title:</strong> ${entry.title}</div>
              <div><strong>Time:</strong> ${entry.timestamp}</div>
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `);
});

// Endpoint to update history
app.post('/api/history', express.json(), (req, res) => {
  historyData = req.body;
  res.json({ success: true });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Pages UI server running at http://localhost:${port}`);
});

// Export for testing
export { app, server };