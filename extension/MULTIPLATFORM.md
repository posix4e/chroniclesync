# ChronicleSync Multi-Platform Extension

This document provides instructions for building, testing, and deploying the ChronicleSync extension across multiple platforms: Chrome, Firefox, and Safari (including iOS).

## Building the Extension

### Building for All Platforms

```bash
npm run build:all
```

This will create three zip files:
- `chrome-extension.zip` - For Chrome and other Chromium-based browsers
- `firefox-extension.zip` - For Firefox
- `safari-extension.zip` - For Safari (macOS/iOS)

### Building for Specific Platforms

```bash
# Build for Chrome
npm run build:chrome

# Build for Firefox
npm run build:firefox

# Build for Safari
npm run build:safari
```

## Testing the Extension

### Running E2E Tests on All Platforms

```bash
# Run tests on all platforms
npm run test:e2e

# Run tests on specific platforms
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:webkit
```

## Safari iOS Extension Setup

To build and test the Safari iOS extension:

1. **Prerequisites**:
   - macOS with Xcode installed
   - Apple Developer account
   - iOS device or simulator

2. **Create a Safari App Extension Project**:
   - Open Xcode and create a new Safari App Extension project
   - Configure the project with your Apple Developer account

3. **Integrate the Extension**:
   - Copy the contents of `safari-extension.zip` to the Safari App Extension project
   - Configure the extension in Xcode

4. **Testing on iOS**:
   - Build and run the extension on an iOS device or simulator
   - Enable the extension in Safari settings

## Continuous Integration

The repository includes GitHub Actions workflows for each platform:

- `.github/workflows/chrome-extension.yml` - For Chrome
- `.github/workflows/firefox-extension.yml` - For Firefox
- `.github/workflows/safari-extension.yml` - For Safari

These workflows build and test the extension on each platform.

## Platform-Specific Considerations

### Chrome

- Uses Manifest V3
- Service worker for background scripts

### Firefox

- Uses Manifest V3 with Firefox-specific adaptations
- Requires `browser_specific_settings` in the manifest

### Safari

- Uses Safari Web Extension format
- Requires additional Xcode project for iOS
- Limited extension capabilities on iOS

## Troubleshooting

### Firefox Issues

- If the extension doesn't load, check the Firefox console for errors
- Ensure the extension ID in the manifest matches the ID in the test configuration

### Safari iOS Issues

- Safari on iOS has more restrictions than desktop browsers
- Some extension features may not be available on iOS
- Check the Safari Web Extension documentation for iOS-specific limitations

## Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Firefox Extensions Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Safari Web Extensions Documentation](https://developer.apple.com/documentation/safariservices/safari_web_extensions)