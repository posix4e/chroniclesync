import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// Test pages with known content
const pages = {
  page1: `
    <!DOCTYPE html>
    <html>
      <head><title>Test Page 1</title></head>
      <body>
        <h1>Welcome to Test Page 1</h1>
        <p>This is a test page with some unique content about artificial intelligence.</p>
        <p>AI is transforming how we work and live.</p>
      </body>
    </html>
  `,
  page2: `
    <!DOCTYPE html>
    <html>
      <head><title>Test Page 2</title></head>
      <body>
        <h1>Welcome to Test Page 2</h1>
        <p>This page contains information about machine learning.</p>
        <p>Machine learning is a subset of artificial intelligence.</p>
        <p>Special characters test: !@#$%^&*()</p>
      </body>
    </html>
  `,
  page3: `
    <!DOCTYPE html>
    <html>
      <head><title>Test Page 3</title></head>
      <body>
        <h1>Welcome to Test Page 3</h1>
        <p>This page has some unique text that won't appear elsewhere.</p>
        <p>Testing with a very specific phrase: XYZ123uniqueString789</p>
      </body>
    </html>
  `
};

app.get('/page1', (req, res) => {
  res.send(pages.page1);
});

app.get('/page2', (req, res) => {
  res.send(pages.page2);
});

app.get('/page3', (req, res) => {
  res.send(pages.page3);
});

export function startTestServer(port: number) {
  return new Promise<void>((resolve) => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Test server running on port ${port}`);
      resolve();
    });
  });
}