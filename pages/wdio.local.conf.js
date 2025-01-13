const path = require('path');

exports.config = {
    runner: 'local',
    specs: [
        './test/e2e/**/*.spec.js'
    ],
    exclude: [],
    maxInstances: 1,
    capabilities: [{
        maxInstances: 1,
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--headless=new',
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--window-size=1920,1080',
                '--enable-automation',
                '--load-extension=' + path.join(__dirname, 'dist/chrome'),
                '--disable-extensions-except=' + path.join(__dirname, 'dist/chrome'),
                '--whitelisted-ips=',
                '--remote-debugging-port=9222'
            ],
            binary: process.env.CHROME_BIN || '/usr/bin/google-chrome'
        }
    }],
    logLevel: 'debug',
    bail: 0,
    baseUrl: 'http://localhost:3000',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: [
        ['chromedriver', {
            logFileName: 'wdio-chromedriver.log',
            outputDir: 'test-logs',
            args: ['--silent']
        }]
    ],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    before: async function (capabilities, specs) {
        // Add any setup code here
        await browser.setTimeout({ script: 60000 });
    },
    beforeTest: async function (test, context) {
        // Log test name for debugging
        console.log(`Running test: ${test.title}`);
    },
    afterTest: async function(test, context, { error, result, duration, passed, retries }) {
        if (!passed) {
            // Take a screenshot if the test fails
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
            const screenshotPath = path.join(__dirname, 'test-logs', `error-${timestamp}.png`);
            await browser.saveScreenshot(screenshotPath);
            console.log(`Screenshot saved to: ${screenshotPath}`);
        }
    }
};