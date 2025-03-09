# ChronicleSync Cross-Platform Extension

This document provides instructions for developing, testing, and deploying the ChronicleSync extension across multiple platforms: Chrome, Firefox, and iOS Safari.

## Project Structure

The project is organized as follows:

```
chroniclesync/
├── shared/                  # Shared code across all platforms
├── platforms/               # Platform-specific code
│   ├── chrome/              # Chrome-specific code
│   ├── firefox/             # Firefox-specific code
│   └── safari-ios/          # Safari iOS-specific code
├── e2e/                     # End-to-end tests
├── scripts/                 # Build and utility scripts
└── extension/               # Original extension code
```

## Development Setup

### Prerequisites

- Node.js 20 or later
- npm 9 or later
- Xcode 14 or later (for Safari iOS development)
- Chrome and Firefox browsers

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/posix4e/chroniclesync.git
   cd chroniclesync
   ```

2. Install dependencies:
   ```bash
   # Install extension dependencies
   cd extension
   npm install
   
   # Return to root
   cd ..
   ```

### Building Extensions

To build all extensions:

```bash
# Make the build script executable
chmod +x scripts/build-extensions.js

# Build all extensions
node scripts/build-extensions.js
```

This will create the following files:
- `dist/chroniclesync-chrome.zip`: Chrome extension
- `dist/chroniclesync-firefox.zip`: Firefox extension

For Safari iOS, you need to build using Xcode:

```bash
# Open the Xcode project
open platforms/safari-ios/ChronicleSync.xcodeproj
```

## Testing

### Running E2E Tests

To run end-to-end tests for all browsers:

```bash
cd e2e
npx playwright test
```

To run tests for a specific browser:

```bash
# For Chrome
npx playwright test --project=chromium

# For Firefox
npx playwright test --project=firefox
```

### Testing Safari iOS Extension

To test the Safari iOS extension, you need to run it in the iOS Simulator:

1. Open the Xcode project
2. Select the iOS Simulator
3. Run the app
4. Enable the extension in Safari settings

## Deployment

### Chrome Web Store

1. Build the Chrome extension
2. Upload the `dist/chroniclesync-chrome.zip` file to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

### Firefox Add-ons

1. Build the Firefox extension
2. Upload the `dist/chroniclesync-firefox.zip` file to the [Firefox Add-ons Developer Hub](https://addons.mozilla.org/en-US/developers/)

### Apple App Store

1. Build the Safari iOS extension using Xcode
2. Archive the app
3. Upload to App Store Connect
4. Submit for review

## Synchronization Across Devices

ChronicleSync uses a cloud-based synchronization system to keep your browsing history in sync across all your devices:

1. **Authentication**: Sign in with the same account on all devices
2. **Data Storage**: Your data is stored securely in the cloud
3. **Real-time Sync**: Changes are synchronized in real-time across devices
4. **Offline Support**: The extension works offline and syncs when you're back online

## GitHub Actions Workflows

The repository includes GitHub Actions workflows for automated testing and deployment:

- `.github/workflows/chrome-extension.yml`: Builds and tests the Chrome extension
- `.github/workflows/firefox-extension.yml`: Builds and tests the Firefox extension
- `.github/workflows/safari-ios-extension.yml`: Builds and tests the Safari iOS extension

## Troubleshooting

### Chrome Extension Issues

- Check the extension in `chrome://extensions` with Developer Mode enabled
- Look for errors in the console by clicking "background page" or "service worker"

### Firefox Extension Issues

- Check the extension in `about:debugging#/runtime/this-firefox`
- Click "Inspect" to view the console for errors

### Safari iOS Extension Issues

- Check the Safari settings to ensure the extension is enabled
- Use Safari's Web Inspector to debug the extension