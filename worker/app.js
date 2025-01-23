const express = require('express');
const cors = require('cors');
const historyRoutes = require('./history');

const app = express();
const port = process.env.PORT || 52529;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API routes
app.use('/api/history', historyRoutes);

app.listen(port, '0.0.0.0', () => {
    console.log(`Worker API listening at http://localhost:${port}`);
});