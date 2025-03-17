# ChronicleSync Safari Extension

This directory contains the Safari extension implementation for ChronicleSync, supporting both macOS and iOS platforms.

## Project Structure

- `ChronicleSync/` - Xcode project for the Safari extension
  - `ChronicleSync/` - iOS app that hosts the extension
  - `ChronicleSync Extension/` - Safari extension implementation
  - `ChronicleSync Tests/` - Tests for the extension

## Development Setup

### Prerequisites

- macOS with Xcode 13 or later
- Apple Developer account (for testing on real devices and distribution)

### Building the Extension

1. Open the Xcode project:
   ```
   open ChronicleSync/ChronicleSync.xcodeproj
   ```

2. Select your development team in the Signing & Capabilities tab for both the app and extension targets.

3. Build and run the project on your desired platform (macOS or iOS simulator/device).

### Enabling the Extension

#### On macOS:

1. Run the ChronicleSync app
2. Click "Enable Extension" to open Safari Extension preferences
3. Check the box next to "ChronicleSync" to enable it
4. The extension is now active in Safari

#### On iOS:

1. Install the ChronicleSync app
2. Open the Settings app
3. Navigate to Safari > Extensions
4. Enable the ChronicleSync extension
5. Set the necessary permissions when prompted

## Building for Distribution

The extension can be built for distribution using the provided build script:

```bash
npm run build:safari
```

This will:
1. Build the extension JavaScript files
2. Copy them to the Safari extension resources
3. Build the macOS and iOS apps
4. Create distribution packages

## CI/CD Integration

The Safari extension is integrated into the existing CI/CD pipeline and will be built on macOS runners. The GitHub Actions workflow will:

1. Build the extension on a macOS runner
2. Sign the extension with the provided certificates and provisioning profiles
3. Create distribution packages for both macOS and iOS
4. Upload the packages as artifacts

## Testing

The extension includes basic tests that can be run from Xcode. These tests verify:

1. The app initializes correctly
2. The extension bundle identifier is correctly determined
3. Basic functionality works as expected

To run the tests, open the Xcode project and use the Test navigator (⌘6) to run the tests.