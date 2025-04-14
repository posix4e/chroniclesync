# Safari IPA Build Process

This document describes the process for building the Safari IPA (iOS App) version of the ChronicleSync extension.

## Prerequisites

- macOS with Xcode installed
- Apple Developer account with appropriate provisioning profiles
- Node.js and npm

## GitHub Actions Setup

The Safari IPA build is automated using GitHub Actions. The workflow uses two repository secrets:

- `APPLE_TEAM_ID`: Your Apple Developer Team ID
- `APPLE_APP_ID`: The App ID for your Safari extension

These secrets are used in the GitHub Actions workflow to authenticate with Apple's services and properly sign the IPA file.

## Manual Build

To build the Safari IPA manually, you can use the provided script:

```bash
cd extension
npm run build:safari-ipa -- --team-id "YOUR_TEAM_ID" --app-id "YOUR_APP_ID"
```

Or run the script directly:

```bash
./scripts/build-safari-ipa.sh --team-id "YOUR_TEAM_ID" --app-id "YOUR_APP_ID"
```

## Build Output

The build process creates an IPA file in the `extension/safari-build` directory. This file can be installed on iOS devices using appropriate deployment methods.

## Troubleshooting

If you encounter issues with the build process:

1. Ensure your Apple Developer account has the necessary permissions
2. Verify that your Team ID and App ID are correct
3. Check that your provisioning profiles are valid and properly configured
4. Make sure Xcode is properly installed and configured

## Additional Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Safari Web Extensions Documentation](https://developer.apple.com/documentation/safariservices/safari_web_extensions)