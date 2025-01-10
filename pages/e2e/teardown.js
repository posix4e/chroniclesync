const { MockWorkerServer } = require('./mockServer');

const mockServer = new MockWorkerServer(8787);

async function globalTeardown() {
  await mockServer.stop();
}

module.exports = globalTeardown;