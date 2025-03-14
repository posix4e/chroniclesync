# ChronicleSync Safari Extension

This document provides instructions for building, testing, and deploying the ChronicleSync extension for Safari on iOS and macOS.

## Prerequisites

- macOS computer with Xcode 14+ installed
- Apple Developer account (for distribution)
- Node.js 16+ and npm

## Building the Safari Extension

### 1. Install Dependencies

```bash
cd extension
npm install
```

### 2. Build the Safari Extension Files

```bash
npm run build:safari
```

This will create a `safari-app` directory with the necessary files for a Safari App Extension.

### 3. Open and Configure in Xcode

1. Open the `safari-app/ChronicleSync.xcodeproj` file in Xcode
2. Configure the signing certificates:
   - Select the project in the Navigator
   - Select the "ChronicleSync" target
   - Go to the "Signing & Capabilities" tab
   - Sign in with your Apple Developer account
   - Select your Team
   - Repeat for the "ChronicleSync Extension" target

### 4. Build and Run

1. Select the "ChronicleSync" scheme
2. Choose a simulator or connected device
3. Click the Run button (▶️)

### 5. Enable the Extension

1. In Safari on the simulator/device, open Safari Preferences
2. Go to the Extensions tab
3. Enable the "ChronicleSync Extension"

## Testing with Playwright

### Running Tests on iOS Safari

We've configured Playwright to test on iOS Safari using the Xcode simulator.

```bash
# Run the iOS Safari tests
npm run test:e2e:ios

# Run with debugging enabled
npm run test:e2e:ios-debug
```

Alternatively, use the provided script for a more interactive experience:

```bash
./scripts/run-ios-tests.sh
```

This script will:
1. Check for required dependencies
2. List available iOS simulators
3. Let you choose a simulator or use the default
4. Boot the simulator and open Safari
5. Run the Playwright tests
6. Shut down the simulator when done

## Safari Extension Limitations

Safari extensions on iOS have some limitations compared to Chrome and Firefox:

1. **Background Scripts**: Safari on iOS doesn't support persistent background pages. Use event-based background scripts instead.
2. **API Limitations**: Some Chrome extension APIs are not available in Safari.
3. **Content Script Execution**: Content scripts may behave differently in Safari.
4. **Storage Quotas**: Safari has stricter storage limits.

## Distribution

To distribute the Safari extension:

1. Build the app in Xcode
2. Archive the app (Product > Archive)
3. Upload to the App Store using Xcode's organizer
4. Complete the App Store submission process

## Troubleshooting

- **Extension Not Loading**: Make sure it's enabled in Safari Settings
- **Debugging**: Use Safari's Web Inspector to debug the extension
- **Simulator Issues**: Try resetting the simulator (Device > Erase All Content and Settings)
- **Build Errors**: Check Xcode's signing configuration and capabilities