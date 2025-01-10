const { test, expect } = require('@playwright/test');

// Helper function to retry API calls with better error handling
async function retryRequest(request, url, options = {}, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await request.fetch(url, {
        timeout: 5000, // 5 second timeout per request
        ...options
      });
      
      // Log response details for debugging
      console.log(`Request to ${url} (attempt ${i + 1}/${maxRetries}):`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers())
      });
      
      return response;
    } catch (error) {
      lastError = error;
      console.log(`Request failed (attempt ${i + 1}/${maxRetries}):`, {
        url,
        error: error.message,
        stack: error.stack
      });
      
      if (i === maxRetries - 1) {
        console.error('All retry attempts failed:', {
          url,
          options,
          error: lastError
        });
        throw new Error(`Failed to connect to ${url} after ${maxRetries} attempts: ${lastError.message}`);
      }
      
      const delay = 1000 * Math.pow(2, i); // Exponential backoff: 1s, 2s, 4s
      console.log(`Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

test.describe('ChronicleSync API Tests', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8787';
  const workerUrl = `${baseUrl}/api`;

  test('worker health check', async ({ request }) => {
    test.setTimeout(30000); // 30 seconds for health check
    
    console.log('Testing worker health endpoint...');
    const response = await retryRequest(request, `${baseUrl}/health`);
    
    expect(response.ok(), 'Health check endpoint should return 200').toBeTruthy();
    const data = await response.json();
    expect(data.status, 'Health check should return status "ok"').toBe('ok');
  });

  test('client data operations', async ({ request }) => {
    test.setTimeout(60000); // 60 seconds for data operations
    const clientId = `test-${Date.now()}`;
    const testData = { test: 'data', timestamp: Date.now() };

    console.log('Testing client data operations...', { clientId });

    // Store client data
    console.log('Storing client data...');
    const storeResponse = await retryRequest(request, `${baseUrl}?clientId=${clientId}`, {
      method: 'POST',
      data: testData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    expect(storeResponse.ok(), 'Store operation should succeed').toBeTruthy();
    const storeText = await storeResponse.text();
    expect(storeText, 'Store operation should return success message').toBe('Sync successful');

    // Wait for data to be available (with exponential backoff)
    console.log('Waiting for data to be available...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get client data
    console.log('Retrieving client data...');
    const getResponse = await retryRequest(request, `${baseUrl}?clientId=${clientId}`);
    expect(getResponse.ok(), 'Get operation should succeed').toBeTruthy();
    
    const getData = await getResponse.json();
    expect(getData, 'Retrieved data should match stored data').toEqual(testData);

    // Update client data
    console.log('Updating client data...');
    const updatedData = { ...testData, updated: true };
    const updateResponse = await retryRequest(request, `${baseUrl}?clientId=${clientId}`, {
      method: 'POST',
      data: updatedData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    expect(updateResponse.ok(), 'Update operation should succeed').toBeTruthy();
    const updateText = await updateResponse.text();
    expect(updateText, 'Update operation should return success message').toBe('Sync successful');

    // Wait for update to be processed (with exponential backoff)
    console.log('Waiting for update to be processed...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify update
    console.log('Verifying update...');
    const verifyResponse = await retryRequest(request, `${baseUrl}?clientId=${clientId}`);
    expect(verifyResponse.ok(), 'Verify operation should succeed').toBeTruthy();
    
    const verifyData = await verifyResponse.json();
    expect(verifyData, 'Verified data should match updated data').toEqual(updatedData);
  });

  test('admin operations', async ({ request }) => {
    test.setTimeout(30000); // 30 seconds for admin operations
    
    console.log('Testing admin operations...');
    const response = await retryRequest(request, `${baseUrl}/admin/clients`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_KEY || 'francesisthebest'}`
      }
    });
    
    expect(response.ok(), 'Admin endpoint should return 200').toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data), 'Admin endpoint should return an array').toBeTruthy();
  });
});