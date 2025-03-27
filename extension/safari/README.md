# ChronicleSync Safari Extension

This is the Safari extension version of ChronicleSync, which allows you to sync your browsing history across devices.

## Features

- Sync browsing history across devices
- View and search your browsing history
- Configure sync settings
- Works on iOS Safari

## Structure

The Safari extension consists of:

1. **iOS App**: The container app that provides instructions and settings
2. **Safari Web Extension**: The actual extension that runs in Safari

### UI Scenarios

1. **App Launch**: Shows a settings screen with instructions on how to activate the extension in Safari
2. **Extension Activation**: 
   - If settings are configured: Activates background and content summary functionality
   - If settings are not configured: Automatically launches the settings screen
3. **Extension Click in Browser**: Opens the history view

## Development

### Prerequisites

- Xcode 14.0+
- iOS 15.0+
- macOS 12.0+ (for development)

### Building

1. Open `ChronicleSync.xcodeproj` in Xcode
2. Select your development team
3. Build and run on a device or simulator

### Testing

Run the tests in Xcode or use the command line:

```bash
cd ChronicleSync
xcodebuild test -scheme ChronicleSync -destination 'platform=iOS Simulator,name=iPhone 14,OS=latest'
```

## Differences from Chrome Extension

The Safari extension is based on the Chrome extension but has some key differences:

1. **Container App**: Safari extensions on iOS require a container app
2. **Permissions Model**: Safari has a different permissions model than Chrome
3. **API Compatibility**: Some Chrome APIs are not available in Safari
4. **Settings Flow**: Safari extensions have different activation and settings flows

## License

Same as the main project