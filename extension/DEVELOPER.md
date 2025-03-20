# ChronicleSync Extension Developer Guide

This guide provides detailed information for developers working on the ChronicleSync browser extension.

## Architecture

The ChronicleSync extension consists of several key components:

- **Background Service Worker**: Handles data synchronization and manages IndexedDB operations
- **Content Scripts**: Interact with web pages to capture and sync data
- **Popup Interface**: Provides user controls and sync status information

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Load the extension in browsers:
   
   **Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/dist` directory
   
   **Firefox**:
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `extension/dist/manifest.json` file
   
   **Safari iOS**:
   - See [Safari iOS Extension Developer Guide](safari-ios/DEVELOPER.md) for detailed instructions

## Testing

- Run unit tests:
  ```bash
  npm run test
  ```

- Run E2E tests:
  ```bash
  npm run test:e2e
  ```

## Building for Production

1. Build the production versions:
   ```bash
   # For Chrome
   npm run build:extension
   
   # For Firefox
   npm run build:extension  # Creates both Chrome and Firefox packages
   
   # For Safari iOS
   npm run build:safari-ios
   npm run build:safari-ios-ipa  # Requires macOS
   ```

2. The built extensions will be:
   - Chrome: `chrome-extension.zip`
   - Firefox: `firefox-extension.xpi`
   - Safari iOS: Xcode project in `safari-ios/` directory and IPA file in `build/` directory

## Extension APIs

The extension exposes the following key APIs:

### IndexedDB Operations
- `syncDB.store(data)`: Store data in local IndexedDB
- `syncDB.retrieve(key)`: Retrieve data by key
- `syncDB.delete(key)`: Delete data by key

### Sync Operations
- `sync.start()`: Start synchronization
- `sync.stop()`: Stop synchronization
- `sync.status()`: Get current sync status

## Debugging

### Chrome
1. Access the extension's background page:
   - Go to `chrome://extensions`
   - Find ChronicleSync
   - Click "background page" under "Inspect views"

2. View logs:
   - Open Chrome DevTools
   - Check the Console tab for extension logs
   - Use the Network tab to monitor sync operations

### Firefox
1. Access the extension's background page:
   - Go to `about:debugging#/runtime/this-firefox`
   - Find ChronicleSync
   - Click "Inspect" next to the extension

2. View logs:
   - The Firefox Browser Toolbox will open
   - Check the Console tab for extension logs

### Safari iOS
1. Debugging on iOS devices:
   - Connect your iOS device to a Mac
   - Open Safari on the Mac
   - Enable Web Inspector in Safari's Advanced settings
   - Open the Develop menu and select your device
   - Select the Safari extension to inspect

2. Debugging in Simulator:
   - Run the app in the iOS Simulator
   - Open Safari on the Mac
   - Open the Develop menu and select the Simulator
   - Select the Safari extension to inspect

## Common Issues and Solutions

1. **Sync Not Working**
   - Check network connectivity
   - Verify Cloudflare Worker is running
   - Check browser console for errors

2. **Permission Issues**
   - Ensure all required permissions are listed in manifest.json
   - Check if site permissions are granted

3. **Build Issues**
   - Clear node_modules and reinstall dependencies
   - Verify Node.js version compatibility
   
4. **Safari iOS Issues**
   - Ensure Xcode is properly configured
   - Check that the Safari extension is enabled in Settings
   - Verify the app has the correct entitlements for Safari extensions