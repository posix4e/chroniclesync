# ChronicleSync Safari Extension for iOS

This is the Safari extension version of ChronicleSync for iOS devices. It allows users to synchronize their browsing history across devices using the ChronicleSync service.

## Development Setup

### Prerequisites

- Xcode 14.0 or later
- iOS 15.0 or later
- macOS 12.0 or later
- Node.js 20.0 or later
- Apple Developer account (for testing on physical devices and TestFlight distribution)

### Building the Extension

1. First, build the core extension code:

```bash
cd ../extension
npm install
npm run build
```

2. Then, build the Safari extension:

```bash
cd ../safari-extension
./build-safari-extension.sh
```

3. Open the Xcode project:

```bash
open ChronicleSync.xcodeproj
```

4. Build and run the project in Xcode.

### Testing on a Device

1. Connect your iOS device to your Mac.
2. Set your development team in Xcode:
   - Select the ChronicleSync project in the Project Navigator
   - Select the ChronicleSync target
   - Go to the Signing & Capabilities tab
   - Select your team from the Team dropdown
3. Set your development team in the test-on-device.sh script:
   ```bash
   export DEVELOPMENT_TEAM=YOUR_TEAM_ID
   ./test-on-device.sh
   ```
4. Or run the script directly and it will prompt you for the team ID:
   ```bash
   ./test-on-device.sh
   ```
5. Open Safari on your device.
6. Go to Settings > Safari > Extensions.
7. Enable the ChronicleSync extension.
8. Grant the necessary permissions when prompted.

## Architecture

The Safari extension reuses most of the code from the Chrome/Firefox extension, with a few key differences:

1. The extension is packaged as an iOS app with a Safari App Extension.
2. The manifest.json file has been modified to be compatible with Safari's requirements.
3. The extension uses Safari's extension APIs instead of Chrome's.
4. The iOS app provides a user interface for enabling and configuring the extension.

### Key Components

- **ChronicleSync Extension**: The actual Safari web extension that runs in the browser
- **ChronicleSync App**: The iOS app that hosts the extension and provides configuration options
- **SafariWebExtensionHandler.swift**: Handles communication between the extension and the iOS app
- **ViewController.swift**: Main view controller for the iOS app
- **SettingsViewController.swift**: Settings interface for the iOS app

## Testing

Basic tests are included to verify that the extension loads correctly:

- **SafariExtensionTests.swift**: Tests that verify the extension's manifest and scripts are properly loaded
- **ChronicleSync_Tests.swift**: Basic tests for the iOS app

To run the tests:

1. Open the Xcode project
2. Select Product > Test (or press Cmd+U)

## GitHub Actions

The extension is built and tested on GitHub Actions using macOS runners:

- **safari-extension.yml**: Builds and tests the extension on every push to main or safari-extension-support branches
- **testflight.yml**: Manually triggered workflow to build and upload the app to TestFlight

## TestFlight Distribution

To set up TestFlight distribution, follow the instructions in [TESTFLIGHT_SETUP.md](TESTFLIGHT_SETUP.md).

## Debugging

To debug the Safari extension:

1. Run the app in Xcode with the debugger attached
2. Open Safari and enable the extension
3. Use Safari's Web Inspector to debug the extension's JavaScript code
4. Check the Xcode console for logs from the native part of the extension

## Known Limitations

- Safari on iOS has more restrictive permissions than desktop browsers
- Some features available in Chrome may not work in Safari
- Background scripts have more limited functionality in Safari

## Future Improvements

- Add more comprehensive tests
- Improve the iOS app's user interface
- Add automated UI tests
- Add support for Safari-specific features
- Optimize performance for iOS devices