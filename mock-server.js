const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 54113; // Use the port provided in the runtime information

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(bodyParser.json());

// Mock data storage
const historyData = {};

// Endpoint for syncing history
app.post('/history/sync', (req, res) => {
  const clientId = req.query.clientId;
  const payload = req.body;
  
  console.log(`Received sync request for client ${clientId}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  // Store the history data
  if (!historyData[clientId]) {
    historyData[clientId] = [];
  }
  
  // Add new history items
  historyData[clientId] = [
    ...historyData[clientId],
    ...payload.history
  ];
  
  // Return success response
  res.json({
    success: true,
    message: 'History synced successfully',
    count: payload.history.length
  });
});

// Endpoint for retrieving history
app.get('/history', (req, res) => {
  const clientId = req.query.clientId;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 50;
  
  console.log(`Received history request for client ${clientId}`);
  
  // Get history for the client
  const clientHistory = historyData[clientId] || [];
  
  // Paginate results
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedHistory = clientHistory.slice(startIndex, endIndex);
  
  // Return paginated history
  res.json({
    success: true,
    history: paginatedHistory,
    total: clientHistory.length,
    page,
    pageSize
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});