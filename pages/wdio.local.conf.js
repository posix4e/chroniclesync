import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export const config = {
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
                '--headless',
                '--disable-gpu',
                '--window-size=1920,1080'
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
    services: [
        ['chromedriver', {
            logFileName: 'wdio-chromedriver.log',
            outputDir: 'logs',
            args: ['--silent']
        }]
    ],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    autoCompileOpts: {
        autoCompile: true,
        tsNodeOpts: {
            project: './tsconfig.json',
            transpileOnly: true
        }
    },
    // Hook to ensure extension is loaded before tests
    before: async function (capabilities) {
        // Log browser info
        console.log('Running tests with capabilities:', capabilities);
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs');
        }
    }
};