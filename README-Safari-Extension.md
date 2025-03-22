# ChronicleSync Safari Extension for iOS

This repository contains both the original ChronicleSync Chrome extension and a new Safari extension for iOS that wraps the Chrome extension functionality.

## Project Structure

The project is organized as follows:

- **extension/**: Original Chrome extension code
- **ChronicleSync-iOS/**: iOS Safari extension project
  - **ChronicleSync-iOS/**: Main iOS app container
  - **ChronicleSync-Extension/**: Safari extension target
  - **ChronicleSync-ExtensionTests/**: Integration tests

## Features

The Safari extension provides the same functionality as the Chrome extension:

- Sync browsing history across devices
- View and search history
- Configure sync settings
- Privacy controls

## Development

### Prerequisites

- Xcode 14.0 or later
- iOS 16.0 or later
- macOS 12.0 or later (for development)

### Building the Chrome Extension

```bash
cd extension
npm install
npm run build
```

### Building the Safari Extension

1. Open `ChronicleSync-iOS/ChronicleSync-iOS.xcodeproj` in Xcode
2. Select your development team in the Signing & Capabilities tab
3. Build and run the project

## Architecture

The Safari extension reuses code from the Chrome extension through a compatibility layer that maps Chrome extension APIs to Safari extension APIs. This approach minimizes code duplication and ensures consistent behavior across platforms.

### Key Components

- **SafariWebExtensionHandler**: Handles communication between the Safari extension and the iOS app
- **SettingsViewController**: Manages user settings that are shared with the extension
- **browser-polyfill.js**: Compatibility layer for Chrome extension APIs

## Continuous Integration

The project includes a GitHub Actions workflow that:

1. Builds the Safari extension on macOS
2. Runs tests
3. Creates an unsigned IPA file

## License

This project is licensed under the same terms as the original ChronicleSync Chrome extension.