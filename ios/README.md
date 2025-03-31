# ChronicleSync Safari iOS Extension

This directory contains the iOS app that hosts the Safari extension version of ChronicleSync.

## Project Structure

- `ChronicleSync/` - The Xcode project directory
  - `ChronicleSync/` - The iOS app target
  - `Extension/` - The Safari extension target
  - `ChronicleSync.xcodeproj/` - The Xcode project file

## Building the App

### Prerequisites

- Xcode 14.0 or later
- macOS 12.0 or later
- Node.js 16 or later

### Build Steps

1. Build the extension code:
   ```
   cd ../extension
   npm run build:ios
   ```

2. Open the Xcode project:
   ```
   open ChronicleSync/ChronicleSync.xcodeproj
   ```

3. Build the app in Xcode or use the command line:
   ```
   cd ../extension
   npm run xcode:build
   ```

4. To create an IPA file:
   ```
   cd ../extension
   npm run xcode:export-ipa
   ```

## Testing the Extension

1. Install the app on an iOS device
2. Open the Settings app
3. Navigate to Safari > Extensions
4. Enable the ChronicleSync extension
5. Grant the necessary permissions when prompted

## Differences from Chrome Extension

The Safari extension has some limitations compared to the Chrome extension:

- Limited access to browser history API
- Different permissions model
- No support for the `chrome.scripting` API

These differences are handled by the platform adapter in `extension/src/platform/index.ts`.

## Troubleshooting

- If you encounter code signing issues, you may need to set up a development team in Xcode
- For testing without code signing, use the `CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO` flags with xcodebuild