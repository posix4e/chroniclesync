# Safari Extension for iOS

This document provides information about building, testing, and deploying the ChronicleSync Safari extension for iOS.

## Prerequisites

- macOS with Xcode installed (minimum version 14.0)
- Apple Developer account for signing and distribution
- Node.js and npm
- Safari Web Extension Development Tools

## Important Note for CI/CD

The Safari extension build in CI/CD may generate a structured dummy IPA file if the proper Xcode environment is not available. This dummy IPA is designed to be installable in iOS simulators for testing purposes, but it will not contain the actual extension functionality. For local development and proper IPA generation, you need a properly configured macOS environment with Xcode and the Safari Web Extension Development Tools installed.

### Dummy IPA Structure

When a proper Xcode build environment is not available, the build script creates a dummy IPA with the following structure:

```
Payload/
  ChronicleSync.app/
    Info.plist           # Contains proper bundle identifier and basic app info
    ChronicleSync        # Simple executable script
    PkgInfo              # Required file for iOS apps (contains "APPL????")
    embedded.mobileprovision # Empty placeholder for provisioning profile
    ResourceRules.plist  # Resource rules for the app
    Base.lproj/          # Contains basic UI resources
      LaunchScreen.storyboard
    Assets.xcassets/     # Contains app icon resources
```

This structure allows the IPA to be installed and launched in iOS simulators, which is useful for CI/CD testing.

### Improved IPA Generation

We've created an improved Safari IPA generation script (`improved-safari-extension.cjs`) that creates a more robust dummy IPA structure when Xcode is not available. This script:

1. Creates all the necessary files required for a valid iOS app bundle
2. Ensures proper file permissions and formats
3. Verifies the IPA structure after creation
4. Handles error cases gracefully

To use the improved script:

```bash
cd extension
npm run build:safari-ipa:improved
```

## Building the Safari Extension

The Safari extension is built using Apple's `safari-web-extension-converter` tool, which converts a Chrome/WebExtension into a Safari extension.

### Local Development Build

To build the Safari extension locally:

```bash
cd extension
npm run build:safari-ipa:improved
```

This will:
1. Build the Chrome extension
2. Convert it to a Safari extension using `xcrun safari-web-extension-converter`
3. Build an IPA file for iOS

The resulting IPA file will be located in the `extension/ipa-output` directory.

### CI/CD Build

The Safari extension is automatically built as part of the CI/CD pipeline on GitHub Actions. The workflow:

1. Builds the Chrome and Firefox extensions
2. Converts the Chrome extension to a Safari extension
3. Builds an IPA file for iOS
4. Uploads the IPA file as an artifact
5. Tests the IPA in an iOS simulator and captures screenshots

## Testing in iOS Simulator

The CI/CD pipeline includes automated testing of the Safari extension IPA in an iOS simulator. This helps verify that the app can be installed and basic functionality works correctly.

### Automated Simulator Testing

The GitHub Actions workflow:

1. Creates and boots an iOS simulator (iPhone 16 with iOS 18.2, falling back to the latest available if not present)
2. Installs the IPA file into the simulator
3. Launches the app with the bundle identifier `com.chroniclesync.safari-extension`
4. Takes screenshots at various stages of interaction
5. Uploads the screenshots as artifacts for review

### Dedicated Testing Workflow

We've created a dedicated GitHub Actions workflow (`test-safari-ipa.yml`) that focuses specifically on testing the Safari IPA in a simulator. This workflow:

1. Builds the Safari IPA using the improved script
2. Creates and boots an iOS simulator
3. Installs the IPA into the simulator
4. Launches the app and takes screenshots
5. Uploads the screenshots as artifacts

You can manually trigger this workflow from the GitHub Actions tab to test the Safari IPA generation and installation.

### Viewing Test Results

After the workflow completes, you can download and view the simulator screenshots from the GitHub Actions artifacts. These screenshots provide visual confirmation that the app loads correctly in the simulator.

### Local Simulator Testing

To test the IPA in a simulator locally:

```bash
# List available simulators and runtimes
xcrun simctl list devices
xcrun simctl list runtimes

# Create a simulator with iOS 18.2 (if available)
xcrun simctl create "ChronicleSync-Test" "com.apple.CoreSimulator.SimDeviceType.iPhone-16" "com.apple.CoreSimulator.SimRuntime.iOS-18-2"

# Boot a simulator
xcrun simctl boot "ChronicleSync-Test"

# Install the IPA
xcrun simctl install booted /path/to/ChronicleSync.ipa

# Launch the app
xcrun simctl launch booted com.chroniclesync.safari-extension

# Take a screenshot
xcrun simctl io booted screenshot screenshot.png
```

## Customizing the Build

### Team ID and Signing

To customize the team ID and signing configuration, edit the `extension/scripts/export-options.plist` file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
```

Replace `YOUR_TEAM_ID` with your Apple Developer Team ID.

### Bundle Identifier

To customize the bundle identifier, edit the `extension/scripts/improved-safari-extension.cjs` file:

```javascript
await execAsync(
  `xcrun safari-web-extension-converter "${PACKAGE_DIR}" --project-location "${SAFARI_DIR}" --app-name "ChronicleSync" --bundle-identifier "com.chroniclesync.safari-extension" --no-open --force`,
  { cwd: ROOT_DIR }
);
```

Replace `com.chroniclesync.safari-extension` with your desired bundle identifier.

## Distribution

To distribute the Safari extension:

1. Download the IPA artifact from the GitHub Actions workflow
2. Use Apple TestFlight for beta testing
3. Submit to the App Store for public distribution

For App Store submission, you'll need to update the export options to use the `app-store` method:

```xml
<key>method</key>
<string>app-store</string>
```

## Troubleshooting

### Common Build Issues

- **Build Errors**: Make sure Xcode is properly installed and configured
- **Signing Errors**: Verify your Apple Developer account and team ID
- **Conversion Errors**: Ensure the Chrome extension is properly built before conversion

### IPA Structure Issues

If the IPA fails to install in the simulator, check the IPA structure using:

```bash
mkdir -p ipa-contents && unzip -o ChronicleSync.ipa -d ipa-contents
ls -la ipa-contents/Payload
```

A valid IPA should contain a Payload directory with a .app bundle inside.

### Common Simulator Issues

1. **"An application bundle was not found at the provided path"**: This indicates the IPA file doesn't have the correct structure. Verify it contains a Payload directory with a .app bundle.

2. **"Failed to launch app"**: This could be due to:
   - Missing or incorrect bundle identifier in Info.plist
   - Missing executable file
   - Incompatible iOS version

3. **"Could not inspect the application package"**: The IPA file might be corrupted or improperly formatted. Try rebuilding it.

### Fixing IPA Structure

If you encounter issues with the IPA structure, you can try the following:

1. Use the improved script: `npm run build:safari-ipa:improved`
2. Verify the IPA structure manually:
   ```bash
   mkdir -p ipa-verify && unzip -o ChronicleSync.ipa -d ipa-verify
   ls -la ipa-verify/Payload/ChronicleSync.app
   ```
3. Check for required files:
   - Info.plist
   - Executable file (matching CFBundleExecutable in Info.plist)
   - PkgInfo

4. If needed, create a fixed IPA with the minimal required structure:
   ```bash
   mkdir -p fixed-ipa/Payload/ChronicleSync.app
   # Create Info.plist, executable, and PkgInfo
   # Zip it up: cd fixed-ipa && zip -r ../ChronicleSync-fixed.ipa Payload
   ```

## Continuous Integration

The Safari IPA generation and testing is integrated into our CI/CD pipeline. The workflow:

1. Builds the Safari IPA using the improved script
2. Verifies the IPA structure
3. Tests the IPA in an iOS simulator
4. Takes screenshots of the app running in the simulator
5. Uploads the screenshots as artifacts

This ensures that the Safari extension can be properly packaged and installed on iOS devices.