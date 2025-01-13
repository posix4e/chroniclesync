const path = require('path');
const fs = require('fs');

// Read the extension as base64
const extensionPath = path.join(__dirname, 'chroniclesync-chrome.zip');
const extensionBase64 = fs.readFileSync(extensionPath).toString('base64');

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
                '--load-extension=' + path.join(__dirname, 'dist/chrome')
            ],
            binary: process.env.CHROME_BIN || '/usr/bin/google-chrome'
        }
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost:3000',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['chromedriver'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    before: function (capabilities, specs) {
        // Add any setup code here
        browser.setTimeout({ script: 60000 });
    }
};