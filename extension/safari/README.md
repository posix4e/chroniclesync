# ChronicleSync Safari Extension

This directory contains the Safari extension for ChronicleSync, which allows the extension to run on iOS devices.

## Requirements

- macOS with Xcode 14.0 or later
- iOS 17.0 or later for deployment
- Apple Developer account for distribution

## Building the Extension

The Safari extension can only be built on macOS. To build the extension:

1. Clone the repository
2. Navigate to the extension directory
3. Run `npm run build:safari`

This will:
- Build the JavaScript files
- Copy them to the Safari extension resources directory
- Build the Safari extension using Xcode (if running on macOS)

## Testing

The Safari extension can be tested using:

```bash
npm run test:e2e:safari
```

This will run basic acceptance tests and take screenshots to demonstrate the extension functionality.

## CI/CD

The CI/CD pipeline includes a macOS runner for building and testing the Safari extension. The workflow:

1. Builds the extension JavaScript files
2. Packages the extension for Safari (on macOS)
3. Runs the Safari-specific tests
4. Captures screenshots during testing
5. Uploads the extension and screenshots as artifacts

## Distribution

To distribute the Safari extension:

1. Open the Xcode project in `safari/ChronicleSync/ChronicleSync.xcodeproj`
2. Configure your Apple Developer account
3. Archive the project
4. Submit to the App Store

## Limitations

Safari extensions on iOS have some limitations compared to desktop browser extensions:

- Limited access to browser APIs
- Content scripts have more restrictions
- Background scripts behave differently
- User interface must conform to iOS guidelines

## Structure

- `ChronicleSync/` - The main iOS app that hosts the extension
- `ChronicleSync Extension/` - The Safari extension
  - `Resources/` - Web resources (HTML, CSS, JS)
  - `SafariWebExtensionHandler.swift` - Native extension handler