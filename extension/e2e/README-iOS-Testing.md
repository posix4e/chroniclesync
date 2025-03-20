# iOS App Testing with Playwright

This directory contains end-to-end tests for the ChronicleSync iOS app using Playwright. Since Playwright cannot directly test native iOS apps, we've created a mock environment that simulates the iOS app's functionality.

## Testing Approach

Our testing approach involves:

1. **Mock iOS Environment**: We've created a mock HTML page that simulates the iOS app's WebView and native functionality.
2. **Native Bridge Simulation**: We simulate the communication between JavaScript and native iOS code.
3. **Test Utilities**: We've created utilities to make testing iOS functionality easier.

## Test Files

- `ios-app.spec.ts`: Basic tests for iOS app functionality
- `ios-extension-integration.spec.ts`: Tests for Safari Web Extension integration with iOS
- `ios-main-app.spec.ts`: Tests for the main iOS app interface
- `utils/ios-test-utils.ts`: Utilities for iOS testing

## Mock iOS App

The mock iOS app is located at `test-pages/mock-ios-app.html`. It simulates:

- Device information display
- Native storage operations (save/load)
- Opening settings and website
- Communication between WebView and native code

## Running the Tests

To run the iOS tests:

```bash
npx playwright test ios-app.spec.ts ios-extension-integration.spec.ts ios-main-app.spec.ts
```

## Test Coverage

These tests cover:

1. **Device Information**: Retrieving and displaying device information
2. **Native Storage**: Saving and loading data from native storage
3. **UI Interactions**: Opening settings and website
4. **Safari Web Extension Integration**: Communication between the Safari Web Extension and native code

## Limitations

Since we're using a mock environment, these tests have some limitations:

1. They don't test the actual native iOS code, only the expected behavior
2. They don't test the actual Safari Web Extension integration, only the expected message passing
3. They don't test the actual UI rendering on iOS devices

For complete testing, these tests should be supplemented with:

1. XCUITest for UI testing on actual iOS devices
2. Unit tests for the Swift code
3. Manual testing on iOS devices

## Future Improvements

Future improvements to the testing approach could include:

1. Integration with Appium for actual iOS device testing
2. Better simulation of Safari Web Extension environment
3. More comprehensive test coverage for edge cases
4. Visual regression testing for UI components