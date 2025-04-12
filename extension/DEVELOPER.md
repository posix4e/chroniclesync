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

3. Load the extension in a browser:
   
   **Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/dist` directory
   
   **Firefox:**
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on..."
   - Select the `extension/dist/manifest.json` file
   
   **Safari (macOS):**
   - Build the Safari extension using `npm run build:safari-ipa`
   - Open the generated Xcode project in the `safari-extension` directory
   - Run the project in Xcode to install on the simulator or a connected device

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

1. Build the production version:
   ```bash
   npm run build
   ```

2. Package the extensions:
   ```bash
   # Build Chrome and Firefox extensions
   npm run build:extension
   
   # Build Safari IPA for iOS (requires macOS with Xcode)
   npm run build:safari-ipa
   ```

3. The built extensions will be available as:
   - Chrome: `chrome-extension.zip`
   - Firefox: `firefox-extension.xpi`
   - Safari iOS: `ipa-output/*.ipa`

For detailed information about the Safari extension, see [SAFARI.md](SAFARI.md).

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

1. Access the extension's background page:
   - Go to `chrome://extensions`
   - Find ChronicleSync
   - Click "background page" under "Inspect views"

2. View logs:
   - Open Chrome DevTools
   - Check the Console tab for extension logs
   - Use the Network tab to monitor sync operations

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