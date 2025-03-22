# ChronicleSync Safari Extension

This project is a Safari extension for iOS that wraps the ChronicleSync Chrome extension, allowing users to synchronize their browsing history across devices.

## Project Structure

The project consists of the following components:

- **iOS App Container**: The main iOS app that hosts the Safari extension
- **Safari Extension**: The extension that integrates with Safari
- **Tests**: Unit and integration tests for the app and extension

## Features

- Synchronize browsing history across devices
- View and search synchronized history
- Configure sync settings
- Privacy controls for content extraction

## Development

### Requirements

- Xcode 14.0 or later
- iOS 17.0 or later
- macOS for development

### Building the Project

1. Clone the repository
2. Open `ChronicleSync.xcodeproj` in Xcode
3. Select the appropriate target (iOS device or simulator)
4. Build and run the project

### Testing

The project includes tests for both the app and the extension:

- **AppTests**: Tests for the main iOS app
- **ExtensionTests**: Tests for the Safari extension

Run the tests using the Xcode Test navigator or via the command line:

```bash
xcodebuild test -project ChronicleSync.xcodeproj -scheme "ChronicleSync Tests" -destination "platform=iOS Simulator,name=iPhone 14"
```

## Chrome Extension Compatibility

The Safari extension uses a compatibility layer to adapt the Chrome extension APIs to Safari's extension APIs. This allows reusing much of the original Chrome extension code with minimal modifications.

The compatibility layer is implemented in `ChromeExtensionCompatibility.js` and provides support for:

- Storage API
- Tabs API
- Runtime API
- History API

## Continuous Integration

The project includes a GitHub Actions workflow that:

1. Builds the Safari extension
2. Runs tests
3. Creates an unsigned IPA file
4. Uploads build artifacts

## License

This project is licensed under the MIT License - see the LICENSE file for details.