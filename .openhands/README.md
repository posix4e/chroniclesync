# OpenHands ChronicleSync P2P Testing

This directory contains scripts and configuration for testing the P2P functionality of ChronicleSync using Playwright.

## Setup

Run the setup script to prepare your environment:

```bash
./.openhands/setup.sh
```

This script will:
- Install npm dependencies
- Install Playwright browsers
- Build the application
- Create necessary test directories
- Set up environment variables

## Running Tests

After setup, you can run the tests using the following npm scripts:

```bash
# Run all tests
npm run test:e2e

# Run specific test suites
npm run test:connection    # P2P connection tests
npm run test:sync          # Data synchronization tests
npm run test:conflict      # Conflict resolution tests
npm run test:performance   # Performance tests
npm run test:security      # Security tests

# Run tests in debug mode
npm run test:e2e:debug
```

## Test Structure

The Playwright tests are organized as follows:

- `e2e/tests/p2p-connection.spec.ts` - Tests for establishing P2P connections
- `e2e/tests/p2p-data-sync.spec.ts` - Tests for data synchronization
- `e2e/tests/p2p-conflict-resolution.spec.ts` - Tests for resolving conflicts
- `e2e/tests/p2p-performance.spec.ts` - Tests for performance with large datasets
- `e2e/tests/p2p-security.spec.ts` - Tests for security aspects

## P2P Test Server

The tests use a dedicated P2P test server that runs two instances of the application on different ports:
- First instance: Port 12000
- Second instance: Port 12001

The server is started automatically when running the tests.

## Troubleshooting

If you encounter issues:

1. Make sure all dependencies are installed
2. Check that the P2P server is running correctly
3. Verify that the test environment variables are set properly
4. Look at the test logs in the `test-results` directory