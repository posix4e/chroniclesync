# ChronicleSync Safari Extension

This repository contains both the original ChronicleSync Chrome extension and a Safari extension version that adapts the Chrome extension for use in Safari.

## Safari Extension

The Safari extension is a simplified version of the Chrome extension, adapted to work with Safari's extension model. It provides the same core functionality:

- Sync browsing history across devices
- View and search history
- Configure sync settings
- Privacy controls

## Building the Safari Extension

The Safari extension is built using GitHub Actions. The workflow:

1. Takes the Chrome extension source code
2. Adapts it for Safari compatibility
3. Creates a zip file that can be used to create a Safari extension

## Manual Installation

To manually install the Safari extension:

1. Download the `ChronicleSync-Safari-Extension.zip` file from the latest GitHub Actions run
2. Unzip the file
3. In Safari, go to Preferences > Advanced and check "Show Develop menu in menu bar"
4. From the Develop menu, select "Show Extension Builder"
5. Click the + button and select "Add Extension..."
6. Navigate to the unzipped extension folder and select it
7. Click "Install" to install the extension

## Architecture

The Safari extension reuses code from the Chrome extension through a compatibility layer that maps Chrome extension APIs to Safari extension APIs. This approach minimizes code duplication and ensures consistent behavior across platforms.

### Key Components

- **manifest.json**: Adapted for Safari compatibility
- **background.js**: Background script from the Chrome extension
- **content-script.js**: Content script from the Chrome extension
- **popup.html**: User interface for the extension

## Continuous Integration

The project includes a GitHub Actions workflow that:

1. Builds the Safari extension on macOS
2. Creates a zip file of the extension

## License

This project is licensed under the same terms as the original ChronicleSync Chrome extension.