# Safari iOS Extension Developer Guide

This guide provides instructions for developing, building, and testing the ChronicleSync Safari iOS extension.

## Prerequisites

- macOS with Xcode 14.0 or later
- Node.js 20 or later
- npm

## Development Setup

1. Clone the repository and navigate to the extension directory:
   ```bash
   git clone https://github.com/posix4e/chroniclesync.git
   cd chroniclesync/extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the Safari iOS extension:
   ```bash
   npm run build:safari-ios
   ```

   This will create an Xcode project in the `safari-ios/ChronicleSync` directory.

## Building and Testing

### Building with Xcode

1. Open the Xcode project:
   ```bash
   open safari-ios/ChronicleSync/ChronicleSync.xcodeproj
   ```

2. Select a simulator or connected iOS device as the build target.

3. Build and run the project (⌘R).

### Building from Command Line

To build an IPA file for testing in a simulator:

```bash
npm run build:safari-ios-ipa
```

This script will:
1. Build the extension
2. Create an IPA file
3. Install and launch the app in an iOS simulator
4. Take a screenshot
5. Output the IPA file and screenshot to the `build` directory

## CI/CD Integration

The Safari iOS extension is integrated into the CI/CD pipeline using GitHub Actions. The workflow:

1. Builds the extension on a macOS runner
2. Creates an IPA file for simulator testing
3. Tests the extension in an iOS simulator
4. Takes a screenshot as verification
5. Uploads the IPA file and screenshot as build artifacts

## Extension Structure

The Safari iOS extension consists of two main components:

1. **iOS App**: A simple container app that allows users to enable the Safari extension.
2. **Safari Web Extension**: The actual extension that runs in Safari, using the same web technologies as the Chrome and Firefox extensions.

### Key Files

- `SafariWebExtensionHandler.swift`: Handles communication between the extension and Safari
- `AppDelegate.swift`: iOS app entry point
- `ViewController.swift`: Main view controller for the iOS app
- `Info.plist`: Configuration files for both the app and extension

### Resources

The web extension resources (HTML, CSS, JS) are copied from the main extension build and packaged with the Safari extension.

## Debugging

To debug the Safari extension:

1. Build and run the app on a simulator or device
2. Open Safari and enable the extension in Settings
3. Use Safari's Web Inspector to debug the extension

## Known Limitations

- Some Chrome/Firefox APIs may not be fully compatible with Safari
- Background scripts work differently in Safari iOS extensions
- Content script injection may have different behavior