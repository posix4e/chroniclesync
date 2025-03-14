import { test, expect } from './utils/extension';

/**
 * Tests for iOS native functionality using Xcode simulator
 * These tests specifically target native iOS Safari functionality
 * that would be available in a real iOS device environment
 */
test.describe('iOS Native Functionality Tests', () => {
  // Only run these tests in the webkit-ios-simulator project
  test.beforeEach(async ({ page }) => {
    // Check if we're running in the webkit-ios environment
    const isIOS = process.env.BROWSER?.includes('webkit-ios');
    test.skip(!isIOS, 'This test only runs in iOS simulator environment');
    
    // Navigate to a test page
    await page.goto('about:blank');
  });

  test('should support iOS Safari user agent', async ({ page }) => {
    // Get the user agent
    const userAgent = await page.evaluate(() => navigator.userAgent);
    console.log('iOS User Agent:', userAgent);
    
    // Verify it contains iOS Safari identifiers
    expect(userAgent).toContain('Safari');
    expect(userAgent).toMatch(/iPhone|iPad|iPod/);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/ios-user-agent.png' });
  });

  test('should support iOS touch events', async ({ page }) => {
    // Create a test page with touch event listeners
    await page.setContent(`
      <html>
        <head>
          <style>
            #touchTarget {
              width: 200px;
              height: 200px;
              background-color: #f0f0f0;
              display: flex;
              align-items: center;
              justify-content: center;
              user-select: none;
            }
            #output {
              margin-top: 20px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div id="touchTarget">Touch here</div>
          <div id="output">No touch events detected</div>
          <script>
            const target = document.getElementById('touchTarget');
            const output = document.getElementById('output');
            
            // Check if touch is supported
            if ('ontouchstart' in window) {
              output.textContent = 'Touch is supported';
            } else {
              output.textContent = 'Touch is NOT supported';
            }
            
            // Add touch event listeners
            target.addEventListener('touchstart', (e) => {
              output.textContent = 'touchstart detected: ' + e.touches.length + ' touches';
              e.preventDefault();
            });
            
            target.addEventListener('touchmove', (e) => {
              output.textContent = 'touchmove detected: ' + e.touches.length + ' touches';
              e.preventDefault();
            });
            
            target.addEventListener('touchend', (e) => {
              output.textContent = 'touchend detected';
              e.preventDefault();
            });
          </script>
        </body>
      </html>
    `);
    
    // Verify touch is supported
    const touchSupported = await page.evaluate(() => 'ontouchstart' in window);
    expect(touchSupported).toBe(true);
    
    // Get the output element text
    const outputText = await page.locator('#output').textContent();
    expect(outputText).toBe('Touch is supported');
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/ios-touch-support.png' });
  });

  test('should support iOS viewport meta tags', async ({ page }) => {
    // Create a test page with viewport meta tag
    await page.setContent(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .info {
              background-color: #f0f0f0;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="info" id="viewport-info">Checking viewport...</div>
          <div class="info" id="device-info">Checking device...</div>
          <script>
            // Get viewport information
            const viewportInfo = document.getElementById('viewport-info');
            viewportInfo.textContent = 'Viewport: ' + 
              window.innerWidth + 'x' + window.innerHeight + 
              ' (Device Pixel Ratio: ' + window.devicePixelRatio + ')';
            
            // Get device information
            const deviceInfo = document.getElementById('device-info');
            deviceInfo.textContent = 'Device: ' + 
              navigator.userAgent;
          </script>
        </body>
      </html>
    `);
    
    // Verify the viewport information is displayed
    const viewportInfoText = await page.locator('#viewport-info').textContent();
    expect(viewportInfoText).toContain('Viewport:');
    expect(viewportInfoText).toContain('Device Pixel Ratio:');
    
    // Get the device pixel ratio
    const devicePixelRatio = await page.evaluate(() => window.devicePixelRatio);
    expect(devicePixelRatio).toBeGreaterThanOrEqual(2); // iOS devices typically have DPR >= 2
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/ios-viewport.png' });
  });

  test('should support iOS-specific CSS features', async ({ page }) => {
    // Create a test page with iOS-specific CSS
    await page.setContent(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .test-box {
              width: 200px;
              height: 100px;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
            }
            .safari-only {
              /* This will only work in Safari */
              -webkit-backdrop-filter: blur(10px);
              background-color: rgba(255, 255, 255, 0.5);
            }
            .result {
              margin-top: 10px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="test-box safari-only">
            Safari-specific CSS
          </div>
          <div class="result" id="result">Checking Safari CSS support...</div>
          <script>
            // Check for Safari-specific CSS support
            const result = document.getElementById('result');
            
            // Check if -webkit-backdrop-filter is supported
            const isBackdropFilterSupported = CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
            result.textContent = '-webkit-backdrop-filter support: ' + 
              (isBackdropFilterSupported ? 'Yes' : 'No');
          </script>
        </body>
      </html>
    `);
    
    // Check if Safari-specific CSS is supported
    const cssSupport = await page.locator('#result').textContent();
    console.log('Safari CSS support:', cssSupport);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/ios-css-support.png' });
  });
});