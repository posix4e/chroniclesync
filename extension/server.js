import express from 'express';
import cors from 'cors';

const app = express();
const port = 54512;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ healthy: true });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running at http://localhost:${port}`);
});