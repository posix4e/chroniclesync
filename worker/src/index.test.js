describe('Worker API Integration Tests', () => {
  const STAGING_URL = 'https://api-staging.chroniclesync.xyz';
  const TEST_CLIENT_ID = `test-${Date.now()}`;
  const TEST_DATA = { key: 'value', timestamp: Date.now() };

  it('handles client data lifecycle', async () => {
    // Store data
    const postRes = await fetch(`${STAGING_URL}/?clientId=${TEST_CLIENT_ID}`, {
      method: 'POST',
      body: JSON.stringify(TEST_DATA),
    });
    expect(postRes.status).toBe(200);

    // Retrieve data
    const getRes = await fetch(`${STAGING_URL}/?clientId=${TEST_CLIENT_ID}`);
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(data).toEqual(TEST_DATA);

    // Delete data through admin API
    const deleteRes = await fetch(`${STAGING_URL}/admin/client?clientId=${TEST_CLIENT_ID}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    expect(deleteRes.status).toBe(200);

    // Verify data is deleted
    const getAfterDeleteRes = await fetch(`${STAGING_URL}/?clientId=${TEST_CLIENT_ID}`);
    expect(getAfterDeleteRes.status).toBe(404);
  });

  it('handles admin operations', async () => {
    // Check status
    const statusRes = await fetch(`${STAGING_URL}/admin/status`, {
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    expect(statusRes.status).toBe(200);
    const status = await statusRes.json();
    expect(status.staging.worker).toBe(true);
    expect(status.staging.database).toBe(true);
    expect(status.staging.storage).toBe(true);

    // List clients
    const clientsRes = await fetch(`${STAGING_URL}/admin/clients`, {
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    expect(clientsRes.status).toBe(200);
    const clients = await clientsRes.json();
    expect(Array.isArray(clients)).toBe(true);
  });

  it('enforces authentication', async () => {
    const res = await fetch(`${STAGING_URL}/admin/status`);
    expect(res.status).toBe(401);
  });
});