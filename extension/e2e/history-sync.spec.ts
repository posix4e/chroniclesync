import { test, expect, getExtensionUrl } from './utils/extension';

test.describe('History Sync Feature', () => {
  test.setTimeout(300000); // Increase timeout to 300 seconds
  test('should sync browser history when navigating to a new page', async ({ context, extensionId }) => {
    // Get initial worker
    let workers = await context.serviceWorkers();
    expect(workers.length).toBeGreaterThan(0);
    let worker = workers[0];

    // Keep the worker alive
    await worker.evaluate(() => {
      // Keep the worker alive
      setInterval(() => {
        console.log('Keeping worker alive');
      }, 1000);
    });

    // Wait for worker to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set up client ID in extension settings
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));
    await settingsPage.locator('#clientId').fill('test-client-id');
    await settingsPage.locator('#environment').selectOption('staging');
    await settingsPage.locator('#saveSettings').click();

    // Wait for settings to be saved
    await settingsPage.waitForTimeout(2000);

    // Wait for settings to be saved and verify
    let settings;
    let settingsSaved = false;
    for (let i = 0; i < 5; i++) {
      settings = await worker.evaluate(async () => {
        const result = await (chrome as any).storage.sync.get(['clientId', 'environment']);
        console.log('All settings:', result);
        return result;
      });
      console.log('Settings from storage:', settings);
      if (settings.clientId === 'test-client-id' && settings.environment === 'staging') {
        settingsSaved = true;
        break;
      }
      await settingsPage.waitForTimeout(1000);
    }

    expect(settingsSaved, 'Settings were not saved correctly').toBe(true);
    expect(settings.clientId).toBe('test-client-id');
    expect(settings.environment).toBe('staging');

    // Close settings page
    await settingsPage.close();

    // Wait for settings to be applied
    let settingsApplied = false;
    for (let i = 0; i < 60; i++) {
      try {
        const { settings, ready, logs } = await worker.evaluate(async () => {
          const settings = await (chrome as any).storage.sync.get(['clientId', 'environment']);
          const { lastLog = '', logs = [] } = await (chrome as any).storage.local.get(['lastLog', 'logs']);
          console.log('Current settings:', settings);
          console.log('Last log:', lastLog);
          console.log('All logs:', logs);

          return { 
            settings,
            ready: !lastLog.includes('No client ID configured') && !lastLog.includes('Client ID required'),
            logs
          };
        });
        console.log('Current settings:', settings);
        console.log('All logs:', logs);
        if (settings.clientId === 'test-client-id' && settings.environment === 'staging' && ready) {
          settingsApplied = true;
          break;
        }
      } catch (error) {
        console.error('Error checking settings:', error);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    expect(settingsApplied).toBe(true);

    // Wait for settings to be fully applied
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Reload the worker to ensure settings are applied
    await worker.evaluate(async () => {
      await (chrome as any).runtime.reload();
      console.log('Background script reloaded');
    });

    // Wait for worker to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get the new worker
    workers = await context.serviceWorkers();
    expect(workers.length).toBeGreaterThan(0);
    worker = workers[0];

    // Wait for worker to be ready
    let workerReady = false;
    for (let i = 0; i < 60; i++) {
      try {
        const { settings, ready } = await worker.evaluate(async () => {
          const settings = await (chrome as any).storage.sync.get(['clientId', 'environment']);
          const { lastLog = '' } = await (chrome as any).storage.local.get('lastLog');
          console.log('Current settings:', settings);
          console.log('Last log:', lastLog);
          return { 
            settings,
            ready: !lastLog.includes('No client ID configured') && !lastLog.includes('Client ID required')
          };
        });
        console.log('Current settings:', settings);
        if (settings.clientId === 'test-client-id' && settings.environment === 'staging' && ready) {
          workerReady = true;
          break;
        }
      } catch (error) {
        console.error('Error checking worker status:', error);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    expect(workerReady).toBe(true);

    // Wait for settings to be fully applied
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Create a new page and navigate to it
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/example-page.png' });

    // Wait for history sync
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify history was synced
    const historyResult = await worker.evaluate(async () => {
      const { logs = [] } = await (chrome as any).storage.local.get('logs');
      console.log('All logs:', logs);
      return { logs };
    });

    console.log('History sync result:', historyResult);
    expect(historyResult.logs).toContain('Navigation to: https://example.com/');

    // Close test page
    await page.close();
  });
});