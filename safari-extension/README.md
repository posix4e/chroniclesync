# ChronicleSync Safari Extension for iOS

This is the Safari extension version of ChronicleSync for iOS devices.

## Development Setup

### Prerequisites

- Xcode 14.0 or later
- iOS 15.0 or later
- macOS 12.0 or later
- Node.js 20.0 or later

### Building the Extension

1. First, build the core extension code:

```bash
cd ../extension
npm install
npm run build
```

2. Then, build the Safari extension:

```bash
cd ../safari-extension
./build-safari-extension.sh
```

3. Open the Xcode project:

```bash
open ChronicleSync.xcodeproj
```

4. Build and run the project in Xcode.

### Testing on a Device

1. Connect your iOS device to your Mac.
2. Select your device as the build target in Xcode.
3. Build and run the app on your device.
4. Open Safari on your device.
5. Go to Settings > Safari > Extensions.
6. Enable the ChronicleSync extension.

## Architecture

The Safari extension reuses most of the code from the Chrome/Firefox extension, with a few key differences:

1. The extension is packaged as an iOS app with a Safari App Extension.
2. The manifest.json file has been modified to be compatible with Safari's requirements.
3. The extension uses Safari's extension APIs instead of Chrome's.

## Testing

Basic tests are included to verify that the extension loads correctly. More comprehensive tests will be added in the future.

## GitHub Actions

The extension is built and tested on GitHub Actions using macOS runners. The workflow is defined in `.github/workflows/safari-extension.yml`.

## Future Improvements

- Add more comprehensive tests
- Set up TestFlight distribution
- Add automated UI tests