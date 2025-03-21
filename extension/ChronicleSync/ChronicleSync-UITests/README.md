# ChronicleSync Safari Extension UI Tests

This directory contains UI tests for the ChronicleSync Safari extension. These tests are designed to run on iOS simulators and test the functionality of the Safari extension in a way that's similar to the Chrome extension tests.

## Test Structure

The tests are organized into several files:

- `TestConfig.swift`: Configuration settings for the tests
- `TestHelpers.swift`: Helper methods for common test operations
- `ExtensionTests.swift`: Tests for basic extension functionality
- `HistoryViewTests.swift`: Tests for the history view functionality
- `SettingsTests.swift`: Tests for the settings functionality

## Running the Tests

To run the tests:

1. Open the ChronicleSync Xcode project
2. Start the backend server with `npm run start-test-server` from the extension directory
3. Select the "ChronicleSync-UITests" scheme
4. Choose an iOS simulator
5. Run the tests (Cmd+U)

## Test Environment

The tests require:

- A running backend server (same as the Chrome extension tests)
- An iOS simulator with Safari
- The ChronicleSync extension installed and enabled in Safari

## Test Coverage

The tests cover:

- Extension loading and initialization
- API health check
- Popup UI functionality
- Content search
- History synchronization
- Settings management

## Adding New Tests

To add new tests:

1. Create a new Swift file in the ChronicleSync-UITests directory
2. Subclass `XCTestCase`
3. Add test methods prefixed with `test`
4. Use the helper methods from `TestHelpers.swift` for common operations

## Continuous Integration

These tests are configured to run in GitHub Actions using the `safari-uitests.yml` workflow file. The workflow:

1. Builds the Safari extension
2. Starts the backend server
3. Runs the UI tests on an iOS simulator
4. Uploads the test results as artifacts