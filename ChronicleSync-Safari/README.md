# ChronicleSync Safari Extension

This is the iOS Safari extension version of the ChronicleSync Chrome extension. It allows you to use ChronicleSync functionality in Safari on iOS devices.

## Features

- Integrates with the existing ChronicleSync functionality
- Provides a native iOS app for managing the extension
- Supports all the same features as the Chrome extension

## Development

### Prerequisites

- Xcode 14.0 or later
- iOS 15.0 or later
- macOS 12.0 or later (for development)

### Building the Project

1. Open the `ChronicleSync-Safari.xcodeproj` file in Xcode
2. Select your development team in the Signing & Capabilities tab
3. Build and run the project on your device or simulator

### Testing

The project includes unit tests and UI tests:

- Run unit tests with `⌘+U` in Xcode
- UI tests can be run individually from the Test navigator

## Architecture

The Safari extension consists of:

1. A native iOS app that serves as a container for the extension
2. A Safari Web Extension that contains the adapted Chrome extension code
3. A communication layer between the native app and the extension

## Deployment

The project includes a GitHub Actions workflow that:

1. Builds the project
2. Runs tests
3. Creates an unsigned IPA file for distribution

To create a signed IPA for App Store distribution, you'll need to:

1. Configure the appropriate certificates and provisioning profiles
2. Update the build settings in Xcode
3. Use Xcode's Archive functionality to create a signed IPA

## License

Same as the main ChronicleSync project.