# ChronicleSync Safari Extension for iOS

This is the iOS Safari extension version of ChronicleSync, which allows you to sync your browsing history across devices.

## Project Structure

- **ChronicleSync-iOS**: The main iOS app container
  - Contains the settings UI and extension management
- **ChronicleSync-Extension**: The Safari extension
  - Reuses code from the Chrome extension
  - Includes compatibility layer for Safari
- **ChronicleSync-ExtensionTests**: Tests for the extension

## Development

### Prerequisites

- Xcode 14.0 or later
- iOS 16.0 or later
- macOS 12.0 or later (for development)

### Building the Project

1. Open `ChronicleSync-iOS.xcodeproj` in Xcode
2. Select your development team in the Signing & Capabilities tab
3. Build and run the project

### Testing

Run the tests using Xcode's Test Navigator or via the command line:

```bash
xcodebuild test -project ChronicleSync-iOS.xcodeproj -scheme "ChronicleSync-ExtensionTests" -destination "platform=iOS Simulator,name=iPhone 14"
```

## Architecture

The project uses a shared code approach where the core functionality from the Chrome extension is reused in the Safari extension. A compatibility layer is provided to handle the differences between the Chrome and Safari extension APIs.

### Key Components

- **SafariWebExtensionHandler**: Handles communication between the Safari extension and the iOS app
- **SettingsViewController**: Manages user settings that are shared with the extension
- **background.js**: Background script for the extension
- **content-script.js**: Content script that runs on web pages

## Deployment

The project includes a GitHub Actions workflow that builds the extension, runs tests, and creates an unsigned IPA file for distribution.

## License

This project is licensed under the same terms as the original ChronicleSync Chrome extension.