const { test, expect } = require('@playwright/test');

test.describe('ChronicleSync API Tests', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8787';
  let clientId;
  let testData;

  // Configure shorter timeouts and run tests serially
  test.setTimeout(5000);
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    clientId = `test-${Date.now()}`;
    testData = { test: 'data', timestamp: Date.now() };
  });

  test('API endpoints should be accessible', async ({ request }) => {
    // Test multiple endpoints in parallel
    const endpoints = [
      { url: `${baseUrl}/health`, expectedStatus: 200 },
      { url: `${baseUrl}?clientId=invalid`, expectedStatus: 404 },
      { 
        url: `${baseUrl}/admin/clients`,
        expectedStatus: 401,
        description: 'unauthorized admin access'
      }
    ];

    await Promise.all(endpoints.map(async ({ url, expectedStatus, description }) => {
      const response = await request.fetch(url);
      expect(response.status, description).toBe(expectedStatus);
    }));
  });

  test('client data lifecycle', async ({ request }) => {
    // Store data
    const storeResponse = await request.fetch(`${baseUrl}?clientId=${clientId}`, {
      method: 'POST',
      data: testData,
      headers: { 'Content-Type': 'application/json' }
    });
    expect(storeResponse.ok()).toBeTruthy();
    expect(await storeResponse.text()).toBe('Sync successful');

    // Get data (should be immediately available in dev/test environment)
    const getResponse = await request.fetch(`${baseUrl}?clientId=${clientId}`);
    expect(getResponse.ok()).toBeTruthy();
    expect(await getResponse.json()).toEqual(testData);

    // Update data
    const updatedData = { ...testData, updated: true };
    const updateResponse = await request.fetch(`${baseUrl}?clientId=${clientId}`, {
      method: 'POST',
      data: updatedData,
      headers: { 'Content-Type': 'application/json' }
    });
    expect(updateResponse.ok()).toBeTruthy();

    // Verify update
    const verifyResponse = await request.fetch(`${baseUrl}?clientId=${clientId}`);
    expect(verifyResponse.ok()).toBeTruthy();
    expect(await verifyResponse.json()).toEqual(updatedData);
  });

  test('admin operations', async ({ request }) => {
    const adminKey = process.env.ADMIN_KEY || 'francesisthebest';
    
    // Test admin endpoints in parallel
    const adminTests = [
      {
        url: `${baseUrl}/admin/clients`,
        validate: (data) => expect(Array.isArray(data)).toBeTruthy()
      },
      {
        url: `${baseUrl}/admin/status`,
        validate: (data) => {
          expect(data.production).toBeDefined();
          expect(data.staging).toBeDefined();
        }
      }
    ];

    await Promise.all(adminTests.map(async ({ url, validate }) => {
      const response = await request.fetch(url, {
        headers: { 'Authorization': `Bearer ${adminKey}` }
      });
      expect(response.ok()).toBeTruthy();
      validate(await response.json());
    }));
  });
});