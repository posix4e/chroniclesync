# ChronicleSync Safari Extension for iOS

This directory contains the iOS Safari extension for ChronicleSync, which allows users to sync their browsing history across devices.

## Project Structure

- `ChronicleSync/` - The Xcode project directory
  - `ChronicleSync/` - The main iOS app that hosts the Safari extension
  - `ChronicleSync Extension/` - The Safari extension code
  - `ChronicleSync Tests/` - XCTest-based tests for the extension

## Development Requirements

- macOS with Xcode 13.0 or later
- iOS 15.0 or later for testing on device
- Apple Developer account for signing and distribution

## Building the Extension

### Local Development

1. Open the Xcode project:
   ```
   open ChronicleSync/ChronicleSync.xcodeproj
   ```

2. Select a development team in the Signing & Capabilities tab for both the app and extension targets.

3. Build and run the app on a simulator or device.

4. Enable the extension in Safari settings:
   - Open Settings > Safari > Extensions
   - Toggle on the ChronicleSync extension

### Using the Build Script

The `build-safari-extension.sh` script automates the build process:

```bash
./build-safari-extension.sh
```

This script:
1. Copies the web extension resources from the main extension directory
2. Builds the Xcode project
3. Archives the app
4. Exports the IPA file
5. Runs tests and captures screenshots

## Testing

The extension uses XCTest for testing, which allows for:

- UI testing of the main app
- Testing the extension functionality
- Capturing screenshots for documentation and verification

Tests are located in the `ChronicleSync Tests` directory and can be run from Xcode or via the build script.

### Testing Approach

Our testing strategy focuses on ensuring the extension starts and has basic functionality:

1. **App Launch Test**: Verifies the container app launches successfully and shows the expected UI elements
2. **Safari Integration Test**: Tests basic Safari functionality and attempts to access the extension
3. **Settings Integration Test**: Checks if the extension appears in Safari extension settings

Each test captures screenshots at key points, which are saved as test artifacts in CI. This visual verification approach allows us to:

- Confirm the extension UI appears correctly
- Verify the extension is properly registered with Safari
- Document the user flow for enabling and using the extension

### Running Tests Locally

To run tests locally on a Mac:

```bash
cd ChronicleSync
xcodebuild test \
  -project "ChronicleSync.xcodeproj" \
  -scheme "ChronicleSync" \
  -destination "platform=iOS Simulator,name=iPhone 14"
```

### Viewing Test Results

After running tests, screenshots and test results can be found in:

- `~/Library/Developer/Xcode/DerivedData/*/Logs/Test/`
- `build/TestResults/results.xcresult` (when using the build script)

You can open the `.xcresult` bundle in Xcode to view detailed test results and screenshots.

## CI/CD Integration

The extension is integrated into the main CI/CD pipeline with a dedicated macOS runner. The workflow:

1. Builds the web extension resources
2. Builds the Safari extension using the macOS runner
3. Runs tests and captures screenshots
4. Uploads the IPA file and screenshots as artifacts

## Differences from Chrome/Firefox Extensions

- Safari extensions on iOS must be packaged as part of an iOS app
- They use the Safari App Extension model rather than WebExtensions directly
- They require code signing with an Apple Developer certificate
- They have additional security restrictions compared to desktop browser extensions

## Distribution

To distribute the extension:

1. Ensure you have a valid Apple Developer account
2. Configure the appropriate provisioning profiles in Xcode
3. Archive and upload the app to App Store Connect
4. Submit for App Store review