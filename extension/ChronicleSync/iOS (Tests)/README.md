# ChronicleSync iOS Acceptance Tests

This directory contains acceptance tests for the ChronicleSync iOS Safari extension. These tests are designed to run against the live staging or production backend environments.

## Test Structure

The test suite consists of:

1. **Basic Acceptance Tests** - Verify that the app launches correctly and can be installed on a simulator
2. **Safari Extension Tests** - Test the functionality of the Safari extension
3. **Settings Integration Tests** - Verify that the extension appears correctly in Safari settings

## Running Tests

### Locally

To run the tests locally:

1. Open the ChronicleSync Xcode project
2. Select the test scheme
3. Choose a simulator
4. Run the tests (Cmd+U)

### Via GitHub Actions

The tests are automatically run via GitHub Actions workflows:

- `ios-acceptance-tests.yml` - Basic acceptance tests using the IPA file
- `ios-xctest.yml` - More comprehensive XCTest-based tests

You can also manually trigger the workflows from the GitHub Actions tab.

## Environment Configuration

The tests can be configured to run against different environments:

- **Staging** (default) - Uses `https://staging.chroniclesync.xyz` and `https://api-staging.chroniclesync.xyz`
- **Production** - Uses `https://chroniclesync.xyz` and `https://api.chroniclesync.xyz`

## Test Artifacts

The test runs produce several artifacts:

1. **Screenshots** - Visual verification of the app and extension
2. **Test Reports** - Summary of test results
3. **XCTest Results** - Detailed test results from XCTest

## Adding New Tests

To add new tests:

1. Create a new Swift file in this directory
2. Extend `XCTestCase`
3. Add test methods prefixed with `test`
4. Use the `TestHelpers` utilities for common operations

## Best Practices

- Keep tests focused on user-facing functionality
- Use descriptive test names
- Take screenshots at key points for visual verification
- Use the `TestEnvironment` class for environment-specific configuration
- Avoid hardcoding URLs or credentials