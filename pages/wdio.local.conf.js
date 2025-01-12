const path = require('path');
const fs = require('fs');

// Function to read and encode the extension
function getEncodedExtension() {
    const extensionPath = path.join(__dirname, 'chroniclesync-chrome.zip');
    try {
        return fs.readFileSync(extensionPath).toString('base64');
    } catch (error) {
        console.error('Extension file not found:', extensionPath);
        console.error('Make sure to run npm run package:chrome first');
        process.exit(1);
    }
}

exports.config = {
    runner: 'local',
    specs: [
        './src/tests/e2e/**/*.test.js'
    ],
    maxInstances: 1,
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--headless'
            ],
            extensions: [getEncodedExtension()]
        }
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: process.env.STAGING_API_URL || 'https://api-staging.chroniclesync.xyz',
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
    // Hook to ensure extension is loaded before tests
    before: function (capabilities) {
        // Log browser info
        console.log('Running tests with capabilities:', capabilities);
    }
};