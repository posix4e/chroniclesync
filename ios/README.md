# ChronicleSync iOS Safari Extension

This directory contains the iOS Safari extension implementation for ChronicleSync, which allows users to sync their browsing history across devices.

## Project Structure

- `ChronicleSync/` - Main iOS app that hosts the Safari extension
  - `ChronicleSync/` - App source code
  - `ChronicleSync Extension/` - Safari extension source code
  - `ChronicleSync Tests/` - Unit tests
  - `ChronicleSync UITests/` - UI tests with screenshot capture

## Requirements

- Xcode 15.3 or later
- iOS 17.0 or later
- macOS 13.0 or later (for development)

## Development Setup

1. Open the Xcode project:
   ```
   open ios/ChronicleSync/ChronicleSync.xcodeproj
   ```

2. Select a development team in the Signing & Capabilities tab for both the app and extension targets.

3. Build and run the app on a simulator or device.

## Safari Extension

The Safari extension uses the WebExtension API, which is compatible with the Chrome extension API with some limitations. The extension includes:

- Background script (`background.js`) - Handles history syncing and API communication
- Content script (`content-script.js`) - Tracks page visits
- Popup UI (`popup.html`, `popup.js`) - User interface for the extension

## Testing

The project includes both unit tests and UI tests:

- Unit tests verify the basic functionality of the app
- UI tests capture screenshots at key points in the user flow

To run the tests:

1. Open the Xcode project
2. Select Product > Test (⌘U)

## CI/CD Integration

The project includes GitHub Actions workflow configuration for continuous integration and deployment:

- Builds the iOS app and Safari extension
- Runs unit tests
- Runs UI tests and captures screenshots
- Creates a self-signed IPA file
- Uploads artifacts (IPA, screenshots, logs)

## Known Limitations

Safari WebExtensions on iOS have some limitations compared to Chrome extensions:

- Limited background script execution time
- No access to some Chrome-specific APIs
- Different permissions model

## Troubleshooting

If you encounter issues with the extension:

1. Make sure Safari's developer menu is enabled (Settings > Safari > Advanced > Web Inspector)
2. Check that the extension is enabled in Safari settings
3. Check the Safari Web Inspector console for errors

## License

See the main project license file.