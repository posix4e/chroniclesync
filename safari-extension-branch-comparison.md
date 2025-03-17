# Comparison: Main Branch vs. add-safari-extension Branch

This document outlines the key differences between the `main` branch and the `add-safari-extension` branch of the ChronicleSync repository.

## Added Files and Directories

The `add-safari-extension` branch adds the following new files and directories:

### Safari Extension Structure
- `extension/safari/` - Main directory for Safari extension
- `extension/safari/ChronicleSync/` - Xcode project directory
- `extension/safari/ChronicleSync/ChronicleSync/` - Host app for the extension
- `extension/safari/ChronicleSync/ChronicleSync Extension/` - Safari extension implementation
- `extension/safari/ChronicleSync/ChronicleSync Tests/` - Unit tests
- `extension/safari/ChronicleSync/ChronicleSync UITests/` - UI tests
- `extension/safari/README.md` - Documentation for the Safari extension

### Build Scripts
- `extension/scripts/build-safari-extension.sh` - Script to build the Safari extension

### Configuration Files
- `extension/safari/ChronicleSync/ChronicleSync Extension/Resources/manifest.json` - Web Extension manifest
- `extension/safari/ChronicleSync/ChronicleSync Extension/ChronicleSync_Extension.entitlements` - Extension entitlements
- `extension/safari/ChronicleSync/ChronicleSync Extension/Info.plist` - Extension info
- `extension/safari/ChronicleSync/ChronicleSync/Info.plist` - App info

### Swift Source Files
- `extension/safari/ChronicleSync/ChronicleSync/AppDelegate.swift` - App delegate
- `extension/safari/ChronicleSync/ChronicleSync/SceneDelegate.swift` - Scene delegate
- `extension/safari/ChronicleSync/ChronicleSync/ViewController.swift` - Main view controller
- `extension/safari/ChronicleSync/ChronicleSync Extension/SafariWebExtensionHandler.swift` - Extension handler

## Modified Files

The following existing files were modified in the `add-safari-extension` branch:

### Package Configuration
- `extension/package.json` - Added `build:safari` script

### CI/CD Configuration
- `.github/workflows/ci-cd-combined.yml` - Added Safari extension build steps

## Functional Differences

### New Capabilities
- Support for Safari on macOS and iOS
- Native app wrapper for the extension
- Integration with Apple's extension ecosystem

### Build Process Changes
- Additional build step for Safari extension
- Xcode build process for native app
- Code signing requirements for Apple platforms

### Development Workflow Changes
- Need to use Xcode for Safari extension development
- Additional testing requirements for Safari
- Need for Apple Developer account for signing

## Technical Implementation Details

### Extension Architecture
- Uses Safari Web Extension framework
- Same core functionality as Chrome/Firefox extensions
- Wrapped in a native macOS/iOS app

### Platform-Specific Considerations
- Safari has stricter security model
- Some Chrome APIs may not be available or work differently
- Need to handle Safari-specific permissions

### Distribution Method
- Chrome/Firefox: Web Store distribution
- Safari: App Store distribution (requires App Store review)

## Migration Considerations

When working with the Safari extension:

1. Always build the extension files first (`npm run build`)
2. Use Xcode for building and testing the Safari extension
3. Be aware of Safari-specific limitations and differences
4. Test on both macOS and iOS if targeting both platforms
5. Consider the App Store review guidelines for distribution