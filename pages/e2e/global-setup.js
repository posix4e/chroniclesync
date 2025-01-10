async function globalSetup() {
  // Any global setup needed before tests run
  process.env.WORKER_URL = 'http://localhost:8787';
  process.env.ADMIN_KEY = 'test-admin-key';
}

module.exports = globalSetup;