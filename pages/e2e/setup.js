const { MockWorkerServer } = require('./mockServer');
const { createDevServer } = require('./devServer');

const mockServer = new MockWorkerServer(8787);
let devServer;

async function globalSetup() {
  // Start mock server
  await mockServer.start();
  
  // Start dev server
  devServer = await createDevServer(8788);
  
  // Set environment variables
  process.env.WORKER_URL = 'http://localhost:8787';
  process.env.ADMIN_KEY = 'test-admin-key';
  
  // Export the server instance for teardown
  global.__SERVERS__ = { mockServer, devServer };
}

module.exports = globalSetup;