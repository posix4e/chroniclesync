# ChronicleSync Safari iOS Extension

This directory contains the Safari iOS extension for ChronicleSync, which allows the extension to run on iOS devices.

## Project Structure

- `ChronicleSync/` - The main iOS app that hosts the Safari extension
- `ChronicleSync Extension/` - The Safari web extension
  - `Resources/` - Contains the web extension files (HTML, CSS, JS)
  - `SafariWebExtensionHandler.swift` - Handles communication between the extension and Safari

## Building the Extension

To build the Safari iOS extension:

1. Run the build script:
   ```
   npm run build:safari-ios
   ```

This will:
- Build the web extension files
- Copy them to the Safari extension resources directory
- Create a zip file of the Safari iOS extension project

## Testing

The Safari extension can be tested using:

```
npm run test:e2e:safari
```

This runs basic tests using WebKit (Safari's rendering engine).

## CI/CD Integration

The GitHub Actions workflow includes a macOS runner for testing the Safari extension. The workflow:

1. Builds the Safari iOS extension
2. Runs the Safari-specific tests
3. Uploads the Safari iOS extension as an artifact

## Development

For local development and testing on iOS devices, you'll need:

1. Xcode installed on a Mac
2. An Apple Developer account
3. A provisioning profile for the extension

After building the extension, open the Xcode project and run it on a simulator or device.

## Distribution

To distribute the Safari extension:

1. Build the extension using the build script
2. Submit the app to the App Store using Xcode
3. Users can then enable the extension in Safari settings

## Notes

- Safari extensions on iOS have some limitations compared to Chrome/Firefox extensions
- Some APIs may not be available or may work differently
- Testing on real devices is recommended for full compatibility testing