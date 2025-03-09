# Cross-Platform Browser Extension Development Guide

This guide provides comprehensive instructions for developing, building, and testing the ChronicleSync browser extension across multiple platforms: Chrome, Firefox, and Safari (including iOS).

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Development Setup](#development-setup)
3. [Building Extensions](#building-extensions)
4. [Testing Extensions](#testing-extensions)
5. [Platform-Specific Considerations](#platform-specific-considerations)
6. [CI/CD Integration](#cicd-integration)
7. [Safari iOS Development](#safari-ios-development)
8. [Troubleshooting](#troubleshooting)

## Platform Overview

The ChronicleSync extension supports the following platforms:

- **Chrome/Chromium**: Using Manifest V3
- **Firefox**: Using Manifest V3 with Firefox-specific adaptations
- **Safari**: Using Manifest V3 with Safari-specific adaptations
- **Safari iOS**: Using Safari Web Extension framework

Each platform has its own manifest file:
- Chrome: `manifest.json`
- Firefox: `manifest.firefox.json`
- Safari: `manifest.safari.json`

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- For Safari iOS development: macOS with Xcode 14 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/posix4e/chroniclesync.git
   cd chroniclesync/extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers for testing:
   ```bash
   npx playwright install
   ```

## Building Extensions

### Building for All Platforms

To build the extension for all supported platforms:

```bash
npm run build:all
```

This will create the following files:
- `chrome-extension.zip`: Chrome extension package
- `firefox-extension.zip`: Firefox extension package
- `safari-extension.zip`: Safari extension package
- `safari-ios/`: Safari iOS extension project files

### Building for Specific Platforms

To build for a specific platform:

```bash
# Chrome
npm run build:chrome

# Firefox
npm run build:firefox

# Safari
npm run build:safari
```

## Testing Extensions

### Running Tests for All Platforms

To run e2e tests for all platforms (except Safari on non-macOS):

```bash
npm run test:e2e:all
```

### Testing Specific Platforms

```bash
# Chrome
npm run test:e2e:chrome

# Firefox
npm run test:e2e:firefox

# Safari (macOS only)
npm run test:e2e:safari
```

### Manual Testing

#### Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `package/chrome` directory

#### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select the `manifest.json` file in the `package/firefox` directory

#### Safari (macOS)

1. Enable Safari developer menu: Safari > Preferences > Advanced > "Show Develop menu in menu bar"
2. Open Safari and select Develop > Allow Unsigned Extensions
3. Build the Safari extension: `npm run build:safari`
4. Extract the `safari-extension.zip` file
5. Open Safari and select Develop > Show Extension Builder
6. Click the + button and select "Add Extension..."
7. Navigate to the extracted directory and select it

## Platform-Specific Considerations

### Chrome

- Uses service workers for background scripts
- Full support for all Manifest V3 features

### Firefox

- Uses background scripts instead of service workers
- Requires `browser_specific_settings` in the manifest
- Uses `moz-extension://` protocol instead of `chrome-extension://`

### Safari

- Limited support for some extension APIs
- Uses `safari-web-extension://` protocol
- Requires additional permissions for certain features

### Safari iOS

- Requires packaging as an iOS app
- Limited API support compared to desktop Safari
- Requires Apple Developer account for distribution

## CI/CD Integration

The repository includes GitHub Actions workflows for building and testing the extension on all platforms:

- `.github/workflows/multi-platform-extension.yml`: Builds and tests the extension on all platforms

The workflow:
1. Builds the extension packages for all platforms
2. Runs tests for each platform in parallel
3. Uploads artifacts for each platform

## Safari iOS Development

### Setting Up Safari iOS Development Environment

1. Run the Safari iOS setup script:
   ```bash
   ./scripts/setup-safari-ios.sh
   ```

2. Open the generated project in Xcode:
   ```bash
   open safari-ios/ChronicleSync.xcodeproj
   ```

3. Configure the project with your Apple Developer account

4. Build and run the project on an iOS device or simulator

### Testing on iOS Devices

1. Connect your iOS device to your Mac
2. Select your device as the build target in Xcode
3. Build and run the app
4. Open Settings on your iOS device
5. Navigate to Safari > Extensions
6. Enable the ChronicleSync extension
7. Open Safari and test the extension

## Troubleshooting

### Common Issues

#### Extension Not Loading

- **Chrome**: Check `chrome://extensions` for errors
- **Firefox**: Check `about:debugging#/runtime/this-firefox` for errors
- **Safari**: Check the Web Inspector console for errors

#### API Compatibility Issues

- Check the browser compatibility tables in the [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_compatibility_for_manifest.json)
- Use feature detection instead of browser detection
- Implement platform-specific workarounds when necessary

#### Safari iOS Specific Issues

- Make sure the extension is enabled in Settings > Safari > Extensions
- Check that you have the correct entitlements in your Xcode project
- Use the Safari Web Inspector to debug the extension

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/posix4e/chroniclesync/issues) for similar problems
2. Create a new issue with detailed information about the problem
3. Include browser version, platform, and steps to reproduce