# Safari Extension for iOS

This document provides information about building and deploying the ChronicleSync Safari extension for iOS.

## Prerequisites

- macOS with Xcode installed (minimum version 14.0)
- Apple Developer account for signing and distribution
- Node.js and npm
- Safari Web Extension Development Tools

## Important Note for CI/CD

The Safari extension build in CI/CD may generate a placeholder IPA file if the proper Xcode environment is not available. For local development and proper IPA generation, you need a properly configured macOS environment with Xcode and the Safari Web Extension Development Tools installed.

## Building the Safari Extension

The Safari extension is built using Apple's `safari-web-extension-converter` tool, which converts a Chrome/WebExtension into a Safari extension.

### Local Development Build

To build the Safari extension locally:

```bash
cd extension
npm run build:safari-ipa
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

To customize the bundle identifier, edit the `extension/scripts/build-safari-extension.cjs` file:

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

- **Build Errors**: Make sure Xcode is properly installed and configured
- **Signing Errors**: Verify your Apple Developer account and team ID
- **Conversion Errors**: Ensure the Chrome extension is properly built before conversion