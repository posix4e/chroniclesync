# ChronicleSync iOS Safari Extension Tests

This directory contains UI tests for the ChronicleSync iOS Safari Extension. These tests are designed to replicate the functionality of the Playwright E2E tests but using native Swift XCTest framework.

## Test Structure

The tests are organized into several files:

1. `ChronicleExtensionBaseTest.swift` - Base test class with common functionality
2. `ExtensionTests.swift` - Tests for basic extension functionality
3. `HistorySyncTests.swift` - Tests for history synchronization
4. `ContentSearchTests.swift` - Tests for content search functionality
5. `SettingsTests.swift` - Tests for settings functionality
6. `HistoryViewTests.swift` - Tests for history view functionality
7. `ExtensionPageInteractionTests.swift` - Tests for page interaction features
8. `PagesTests.swift` - Tests for various pages in the extension
9. `XCUIElementExtensions.swift` - Helper extensions for XCUIElement
10. `TestsInfo.plist` - Configuration file for the test target

## Running the Tests

To run these tests:

1. Open the ChronicleSync.xcodeproj in Xcode
2. Select the iOS Tests target
3. Choose a simulator or connected iOS device
4. Run the tests using Product > Test or ⌘U

## Test Requirements

- iOS 15.0 or later
- Xcode 13.0 or later
- Safari must be installed on the test device

## Notes

- These tests interact with the actual Safari browser and extension, so they may be affected by changes in Safari's UI
- Some tests may need to be adjusted based on the actual UI of your extension
- The tests assume certain UI elements exist in your extension; you may need to modify them to match your actual implementation

## Troubleshooting

If tests fail:

1. Check that the Safari extension is properly installed and enabled
2. Verify that the UI element identifiers in the tests match your actual implementation
3. Increase sleep times if tests are failing due to timing issues
4. Check the Xcode console for detailed error messages