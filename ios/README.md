# ChronicleSync iOS Safari Extension

This directory contains the iOS Safari extension for ChronicleSync, which wraps the functionality of the Chrome extension.

## Project Structure

- `ChronicleSync/` - The main iOS app
- `ChronicleSync Extension/` - The Safari Web Extension
- `ChronicleSync Tests/` - iOS unit tests

## Building the Project

### Prerequisites

- Xcode 15.0 or later
- Node.js 20.x or later
- npm

### Build Steps

1. Build the Chrome extension first:

```bash
cd ../extension
npm ci
npm run build
```

2. Build the Safari extension:

```bash
cd ../ios
./build-safari-extension.sh
```

3. Open the Xcode project:

```bash
open ChronicleSync/ChronicleSync.xcodeproj
```

4. Build and run the project in Xcode

## Testing

Run the tests in Xcode by selecting the "ChronicleSync Tests" scheme and pressing Cmd+U.

## Creating an Unsigned IPA

The GitHub Actions workflow automatically creates an unsigned IPA. To create one manually:

1. Build for a generic iOS device in Xcode
2. Archive the app
3. Export the archive without signing

## Safari Web Extension

The Safari Web Extension uses the same JavaScript code as the Chrome extension, with adaptations for Safari's extension API where necessary. The main differences are:

- Manifest.json adaptations for Safari
- Native messaging integration with the iOS app
- Storage and permissions handling differences

## Troubleshooting

If you encounter issues with the Safari extension:

1. Check Safari's extension settings to ensure the extension is enabled
2. Verify that the necessary permissions are granted
3. Check the console logs for any errors
4. Ensure the app has the correct entitlements for app groups