const { test, expect } = require('@playwright/test');

test.describe('ChronicleSync App', () => {
  let page;
  let context;
  
  test.beforeEach(async ({ browser }) => {
    // Create a new context for isolation
    context = await browser.newContext();
    page = await context.newPage();
    
    // Navigate and wait for app load
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for app container
    await page.waitForSelector('#app', { state: 'visible' });
  });
  
  test.afterEach(async () => {
    // Clean up after each test
    await context?.close();
  });

  test.describe('Client Operations', () => {
    test('initializes new client successfully', async () => {
      const clientId = `test-${Date.now()}`;
      
      // Wait for and fill client ID input
      const input = await page.waitForSelector('#clientId');
      await input.fill(clientId);
      
      // Click initialize and wait for response
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/client')),
        page.click('#initialize')
      ]);
      
      // Check status
      const status = await page.waitForSelector('#status');
      await expect(status).toHaveText('Connected');
    });

    test('handles offline mode gracefully', async () => {
      const clientId = `test-${Date.now()}`;
      
      // Initialize client
      const input = await page.waitForSelector('#clientId');
      await input.fill(clientId);
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/client')),
        page.click('#initialize')
      ]);

      // Go offline
      await context.setOffline(true);
      
      // Try to sync and check status
      await page.click('#sync');
      const status = await page.waitForSelector('#status');
      await expect(status).toHaveText('Offline');
      
      // Verify data can still be edited
      const editor = await page.waitForSelector('#editor');
      await editor.fill(JSON.stringify({ test: 'offline' }));
      await page.click('#save');
      
      // Check for pending changes indicator
      await page.waitForSelector('#pending-changes');
    });

    test('syncs data with server', async () => {
      const clientId = `test-${Date.now()}`;
      
      // Initialize client
      const input = await page.waitForSelector('#clientId');
      await input.fill(clientId);
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/client')),
        page.click('#initialize')
      ]);
      
      // Add and save data
      const testData = { test: 'sync-test', timestamp: Date.now() };
      const editor = await page.waitForSelector('#editor');
      await editor.fill(JSON.stringify(testData, null, 2));
      
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/data')),
        page.click('#save')
      ]);
      
      // Sync and verify
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/sync')),
        page.click('#sync')
      ]);
      
      const status = await page.waitForSelector('#status');
      await expect(status).toHaveText('Synced');
      await page.waitForSelector('#last-sync');
    });

    test('handles invalid JSON input', async () => {
      const clientId = `test-${Date.now()}`;
      
      // Initialize client
      const input = await page.waitForSelector('#clientId');
      await input.fill(clientId);
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/client')),
        page.click('#initialize')
      ]);
      
      // Try to save invalid JSON
      const editor = await page.waitForSelector('#editor');
      await editor.fill('{ invalid: json }');
      await page.click('#save');
      
      // Check for error message
      const error = await page.waitForSelector('#error');
      await expect(error).toContainText('Invalid JSON');
    });
  });

  test.describe('Admin Interface', () => {
    test.beforeEach(async () => {
      // Login as admin
      const adminInput = await page.waitForSelector('#admin-password');
      await adminInput.fill(process.env.ADMIN_KEY);
      
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/admin/login')),
        page.click('#admin-login')
      ]);
      
      // Wait for admin panel
      await page.waitForSelector('#admin-panel');
    });

    test('shows system status', async () => {
      await page.click('#status-tab');
      
      // Wait for status response
      await page.waitForResponse(res => res.url().includes('/api/admin/status'));
      
      // Check status indicators
      const dbStatus = await page.waitForSelector('#db-status');
      const storageStatus = await page.waitForSelector('#storage-status');
      const workerStatus = await page.waitForSelector('#worker-status');
      
      await expect(dbStatus).toHaveText('Connected');
      await expect(storageStatus).toHaveText('Connected');
      await expect(workerStatus).toHaveText('Connected');
    });

    test('lists active clients', async () => {
      await page.click('#clients-tab');
      
      // Wait for clients table
      const table = await page.waitForSelector('#clients-table');
      
      // Refresh and wait for response
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/admin/clients')),
        page.click('#refresh-clients')
      ]);
      
      // Check for client rows
      const rows = await page.$$('#client-row');
      expect(rows.length).toBeGreaterThan(0);
    });

    test('can view client details', async () => {
      await page.click('#clients-tab');
      
      // Wait for clients to load
      await page.waitForResponse(res => res.url().includes('/api/admin/clients'));
      
      // Click first client and wait for details
      const firstClient = await page.waitForSelector('#client-row');
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/admin/client/')),
        firstClient.click()
      ]);
      
      // Verify details are shown
      await page.waitForSelector('#client-details');
      const data = await page.waitForSelector('#client-data');
      expect(await data.textContent()).toBeTruthy();
    });
  });
});