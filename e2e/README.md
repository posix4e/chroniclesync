# ChronicleSync P2P Testing

This directory contains end-to-end tests for ChronicleSync's P2P functionality using Playwright.

## Test Structure

The tests are organized into the following categories:

1. **P2P Connection Tests** - Tests for establishing and maintaining P2P connections
2. **P2P Data Synchronization Tests** - Tests for data synchronization between P2P instances
3. **P2P Conflict Resolution Tests** - Tests for resolving conflicts in P2P data
4. **P2P Performance Tests** - Tests for P2P performance with large data and batch operations
5. **P2P Security Tests** - Tests for security aspects of P2P communication

## Running Tests

To run all tests:

```bash
npm test
```

To run specific test categories:

```bash
npm run test:connection    # Run connection tests
npm run test:sync          # Run data synchronization tests
npm run test:conflict      # Run conflict resolution tests
npm run test:performance   # Run performance tests
npm run test:security      # Run security tests
```

To run tests with UI:

```bash
npm run test:ui
```

To run tests in debug mode:

```bash
npm run test:debug
```

## Test Environment

The tests require two instances of the application running on different ports:
- Instance 1: http://localhost:12000
- Instance 2: http://localhost:12001

The global setup script will automatically start these instances before running the tests.

## Test Utilities

The `utils` directory contains helper functions for P2P testing:

- `createP2PInstancePage` - Creates a page connected to a P2P instance
- `waitForP2PConnection` - Waits for a P2P connection to be established
- `generateTestId` - Generates a unique test identifier
- `addTestData` - Adds test data to a P2P instance
- `verifyDataSynchronized` - Verifies data synchronization between instances
- `disconnectP2PInstance` - Disconnects a P2P instance
- `reconnectP2PInstance` - Reconnects a P2P instance

## Requirements

The application must expose the following JavaScript functions for the tests to work:

- `window.addData(data)` - Adds data to the application
- `window.getData(id)` - Gets data by ID
- `window.checkDataExists(id)` - Checks if data exists
- `window.updateData(data)` - Updates existing data
- `window.disconnectP2P()` - Disconnects from P2P network
- `window.reconnectP2P()` - Reconnects to P2P network
- `window.addBatchData(items)` - Adds multiple data items
- `window.isPeerAuthenticated()` - Checks if peer is authenticated
- `window.connectWithInvalidCredentials()` - Attempts connection with invalid credentials
- `window.addDataWithIntegrity(data)` - Adds data with integrity verification
- `window.verifyDataIntegrity(id)` - Verifies data integrity
- `window.simulateDataTampering()` - Simulates data tampering

## Test Data Attributes

The application should have the following data-testid attributes for test selectors:

- `[data-testid="p2p-status-connected"]` - Element indicating connected status
- `[data-testid="p2p-status-disconnected"]` - Element indicating disconnected status
- `[data-testid="peer-count"]` - Element showing the number of connected peers