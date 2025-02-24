import express from 'express';
import cors from 'cors';

export function createTestServer(port: number) {
  const app = express();
  app.use(cors());

  // Test pages
  app.get('/page1', (_, res) => {
    res.send('<html><head><title>Test Page 1</title></head><body><h1>Test Page 1</h1></body></html>');
  });

  app.get('/page2', (_, res) => {
    res.send('<html><head><title>Test Page 2</title></head><body><h1>Test Page 2</h1></body></html>');
  });

  app.get('/page3', (_, res) => {
    res.send('<html><head><title>Test Page 3</title></head><body><h1>Test Page 3</h1></body></html>');
  });

  return new Promise<() => void>((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Test server running at http://localhost:${port}`);
      resolve(() => {
        server.close();
      });
    });
  });
}