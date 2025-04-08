// Simple Gun relay server for testing
import express from 'express';
import Gun from 'gun';
import cors from 'cors';

const app = express();
app.use(cors());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Create a Gun instance
Gun({
  web: app.listen(8765)
});

// Log silently in production
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log('Gun relay server running on port 8765');
}