# ChronicleSync Safari iOS Extension

This directory contains the necessary files to build a Safari iOS extension for ChronicleSync.

## Prerequisites

- Xcode 14.0 or later
- iOS 16.0 or later
- macOS 12.0 or later
- Apple Developer Account

## Building the Extension

1. First, build the web extension:

```bash
cd ../extension
npm install
npm run build:extension
```

This will create a `safari-extension.zip` file in this directory.

2. Open the Xcode project:

```bash
open ChronicleSync.xcodeproj
```

3. Configure your development team in the Signing & Capabilities tab.

4. Build and run the project on your iOS device or simulator.

## Creating an IPA for TestFlight

1. In Xcode, select Product > Archive.
2. Once the archive is complete, click "Distribute App".
3. Select "App Store Connect" and follow the prompts.
4. Upload the build to TestFlight.

## Testing on TestFlight

1. Add testers in App Store Connect.
2. Testers will receive an email invitation to test the app.
3. Once installed, they need to:
   - Open the Settings app on their iOS device
   - Navigate to Safari > Extensions
   - Enable the ChronicleSync extension

## Troubleshooting

- If you encounter build errors, make sure you have the latest version of Xcode.
- If the extension doesn't appear in Safari, make sure it's enabled in Settings.
- Check the console logs in Xcode for any errors.