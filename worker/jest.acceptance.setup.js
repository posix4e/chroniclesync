// Increase timeout for all tests
jest.setTimeout(60000);

// Verify required environment variables
beforeAll(() => {
  const requiredEnvVars = ['STAGING_URL'];
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
});