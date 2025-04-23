# ChronicleSync Safari Extension for iOS

This is the iOS Safari extension implementation of ChronicleSync, which allows you to sync your browsing history across devices.

## Project Structure

- `ChronicleSync/` - Main iOS app
- `ChronicleSync Extension/` - Safari Web Extension
- `ChronicleSync Tests/` - Unit tests
- `ChronicleSync UITests/` - UI tests

## Features

- Sync browsing history across devices
- View and search history from all devices
- Configure sync settings
- iOS Safari integration

## Development Setup

### Requirements

- Xcode 14.0 or later
- iOS 16.0 or later
- macOS 12.0 or later (for development)

### Getting Started

1. Open the `ChronicleSync.xcodeproj` file in Xcode
2. Select your development team in the Signing & Capabilities tab
3. Build and run the project on a simulator or device

### Testing

- Run unit tests: `⌘+U` in Xcode or use the Test Navigator
- Run UI tests: Select the UI test target and run tests

## CI/CD Integration

This project includes GitHub Actions workflows for continuous integration:

- Automated building and testing on macOS runners
- Screenshot capture during UI tests
- IPA generation for testing
- Test reports and artifacts upload

## Safari Web Extension

The Safari Web Extension is located in the `ChronicleSync Extension/Resources` directory and includes:

- `manifest.json` - Extension configuration
- `background.js` - Background script for history syncing
- `content-script.js` - Content script for page interaction
- `popup.html/css/js` - Extension popup UI
- `settings.html/css/js` - Settings page
- `history.html/css/js` - History viewing page

## Debugging

To debug the Safari Web Extension:

1. Run the app in Xcode
2. Enable the extension in Safari Settings
3. Open Safari's Web Inspector
4. Select the extension from the Develop menu

## Known Limitations

- Safari on iOS has limited access to browsing history compared to desktop browsers
- Some features available in the Chrome extension may be limited on iOS due to platform restrictions