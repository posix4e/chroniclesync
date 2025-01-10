const { MockWorkerServer } = require('./mockServer');

const mockServer = new MockWorkerServer(8787);

async function globalSetup() {
  // Start mock server
  await mockServer.start();
  
  // Set environment variables
  process.env.WORKER_URL = 'http://localhost:8787';
  process.env.ADMIN_KEY = 'test-admin-key';
}

module.exports = globalSetup;