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
    // Test health endpoint
    const healthResponse = await request.fetch(`${baseUrl}/health`);
    expect(await healthResponse.status()).toBe(200);
    expect(await healthResponse.json()).toEqual({ status: 'ok' });

    // Test invalid client ID
    const invalidClientResponse = await request.fetch(`${baseUrl}?clientId=invalid`);
    expect(await invalidClientResponse.status()).toBe(404);
    expect(await invalidClientResponse.text()).toBe('No data found');

    // Test unauthorized admin access
    const adminResponse = await request.fetch(`${baseUrl}/admin/clients`);
    expect(await adminResponse.status()).toBe(401);
    expect(await adminResponse.text()).toBe('Unauthorized');
  });

  test('client data lifecycle', async ({ request }) => {
    // Store data
    const storeResponse = await request.fetch(`${baseUrl}?clientId=${clientId}`, {
      method: 'POST',
      body: JSON.stringify(testData),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(await storeResponse.status()).toBe(200);
    expect(await storeResponse.text()).toBe('Sync successful');

    // Get data (should be immediately available in dev/test environment)
    const getResponse = await request.fetch(`${baseUrl}?clientId=${clientId}`);
    expect(await getResponse.status()).toBe(200);
    const responseData = await getResponse.json();
    expect(responseData).toEqual(testData);
    const headers = await getResponse.allHeaders();
    expect(headers['content-type']).toBe('application/json');
    expect(headers['last-modified']).toBeDefined();

    // Update data
    const updatedData = { ...testData, updated: true };
    const updateResponse = await request.fetch(`${baseUrl}?clientId=${clientId}`, {
      method: 'POST',
      body: JSON.stringify(updatedData),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(await updateResponse.status()).toBe(200);

    // Verify update
    const verifyResponse = await request.fetch(`${baseUrl}?clientId=${clientId}`);
    expect(await verifyResponse.status()).toBe(200);
    expect(await verifyResponse.json()).toEqual(updatedData);

    // Test unsupported method
    const unsupportedResponse = await request.fetch(`${baseUrl}?clientId=${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(testData),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(await unsupportedResponse.status()).toBe(405);
    expect(await unsupportedResponse.text()).toBe('Method not allowed');
  });

  test('admin operations', async ({ request }) => {
    const adminKey = process.env.ADMIN_KEY || 'francesisthebest';
    const authHeader = { 'Authorization': `Bearer ${adminKey}` };

    // Test admin clients list
    const clientsResponse = await request.fetch(`${baseUrl}/admin/clients`, {
      headers: authHeader
    });
    expect(await clientsResponse.status()).toBe(200);
    const clientsList = await clientsResponse.json();
    expect(Array.isArray(clientsList)).toBeTruthy();
    const testClient = clientsList.find(c => c.clientId === clientId);
    expect(testClient).toBeDefined();
    expect(testClient.dataSize).toBeGreaterThan(0);

    // Test admin status
    const statusResponse = await request.fetch(`${baseUrl}/admin/status`, {
      headers: authHeader
    });
    expect(await statusResponse.status()).toBe(200);
    const status = await statusResponse.json();
    expect(status).toHaveProperty('production');
    expect(status).toHaveProperty('staging');
    expect(status.production.worker).toBe(true);
    expect(status.production.database).toBe(true);
    expect(status.production.storage).toBe(true);

    // Test workflow trigger
    const workflowResponse = await request.fetch(`${baseUrl}/admin/workflow`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create-resources',
        environment: 'production'
      })
    });
    expect(await workflowResponse.status()).toBe(200);
    const workflow = await workflowResponse.json();
    expect(workflow).toEqual({
      message: 'Triggered create-resources workflow for production environment',
      status: 'pending'
    });

    // Test client deletion
    const deleteResponse = await request.fetch(`${baseUrl}/admin/client?clientId=${clientId}`, {
      method: 'DELETE',
      headers: authHeader
    });
    expect(await deleteResponse.status()).toBe(200);
    expect(await deleteResponse.text()).toBe('Client deleted');

    // Verify client is deleted
    const verifyDeleteResponse = await request.fetch(`${baseUrl}?clientId=${clientId}`);
    expect(await verifyDeleteResponse.status()).toBe(404);
    expect(await verifyDeleteResponse.text()).toBe('No data found');
  });
});