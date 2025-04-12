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

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/dist` directory

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
   npm run build:prod
   ```

2. The built extension will be in the `dist` directory, ready for packaging and distribution.

### Building Extension Packages

To build extension packages for different browsers:

```bash
npm run build:extension
```

This will generate:
- `chrome-extension.zip` for Chrome Web Store
- `firefox-extension.xpi` for Firefox Add-ons

### Building Safari IPA for iOS

The Safari iOS extension is built using GitHub Actions. The workflow uses `xcrun safari-web-extension-converter` to convert the web extension to a Safari App Extension and then builds an IPA file.

To build the Safari IPA manually:

1. Build the extension:
   ```bash
   npm run build
   ```

2. Package the extension for Safari:
   ```bash
   mkdir -p safari-package
   # Copy necessary files to the package directory
   cp manifest.json safari-package/
   cp popup.html safari-package/
   # ... (copy all required files)
   cd safari-package && zip -r ../safari-extension.zip ./* && cd ..
   ```

3. Convert to Safari Extension:
   ```bash
   xcrun safari-web-extension-converter safari-extension.zip \
     --project-location ./safari-project \
     --app-name "ChronicleSync" \
     --bundle-identifier "com.chroniclesync.safari-extension" \
     --team-id "YOUR_TEAM_ID" \
     --no-open
   ```

4. Build IPA:
   ```bash
   cd safari-project
   xcodebuild -project "ChronicleSync.xcodeproj" \
     -scheme "ChronicleSync (iOS)" \
     -configuration Release \
     -sdk iphoneos \
     -archivePath ./build/ChronicleSync.xcarchive \
     archive
   
   # Create exportOptions.plist
   # ... (create plist file)
   
   xcodebuild -exportArchive \
     -archivePath ./build/ChronicleSync.xcarchive \
     -exportOptionsPlist exportOptions.plist \
     -exportPath ./build
   ```

The IPA file will be available in the `safari-project/build` directory.

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

4. **Safari IPA Build Issues**
   - Ensure you have the correct Apple Developer Team ID
   - Verify Xcode version compatibility (workflow uses Xcode 15.2)
   - Check that all required Apple certificates are properly configured
   - For GitHub Actions, ensure all required secrets are set:
     - `APPLE_TEAM_ID`: Your Apple Developer Team ID
     - `APPLE_DEVELOPER_ID`: Your Apple Developer ID
     - `APPLE_DEVELOPER_PASSWORD`: Your Apple Developer password