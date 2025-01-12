const path = require('path');
const fs = require('fs');

// Read and encode the extension
const extensionPath = path.join(__dirname, 'chroniclesync-chrome.zip');
const extensionBase64 = fs.readFileSync(extensionPath).toString('base64');

exports.config = {
    runner: 'local',
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'us',
    services: ['sauce'],
    specs: [
        './src/tests/e2e/**/*.test.js'
    ],
    maxInstances: 2,
    capabilities: [{
        browserName: 'chrome',
        browserVersion: 'latest',
        platformName: 'Windows 10',
        'sauce:options': {
            extendedDebugging: true,
            capturePerformance: true
        },
        'goog:chromeOptions': {
            args: ['--no-sandbox'],
            extensions: [extensionBase64]
        }
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: process.env.STAGING_API_URL || 'https://api-staging.chroniclesync.xyz',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
};