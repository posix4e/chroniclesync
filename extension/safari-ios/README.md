# ChronicleSync Safari iOS Extension

This directory contains the Safari iOS extension for ChronicleSync.

## Development

### Prerequisites

- Xcode 14.0 or later
- iOS 15.0 or later
- Apple Developer Account with Safari Extension capabilities

### Building the Extension

1. Open the `ChronicleSync.xcodeproj` file in Xcode
2. Configure your development team in the Signing & Capabilities section
3. Build and run the project on a simulator or device

### Testing with TestFlight

The extension is automatically built and uploaded to TestFlight when changes are merged to the main branch. To test the extension:

1. Ensure you are added as a TestFlight tester for the app
2. Install the TestFlight app on your iOS device
3. Accept the invitation to test the ChronicleSync app
4. Install the app from TestFlight
5. Open the app and follow the instructions to enable the Safari extension

## Manual Building

If you want to build the extension manually:

1. Run `npm run build:safari-ios` from the extension directory
2. This will create a `safari-ios-extension.ipa` file
3. You can then upload this file to TestFlight manually using Transporter or Xcode

## Required GitHub Secrets for TestFlight Deployment

The following secrets need to be set in the GitHub repository for TestFlight deployment:

- `APPLE_TEAM_ID`: Your Apple Developer Team ID
- `APPLE_APP_ID`: The App ID for your iOS app
- `APPLE_API_KEY_ID`: Your App Store Connect API Key ID
- `APPLE_API_KEY_ISSUER_ID`: Your App Store Connect API Key Issuer ID
- `APPLE_API_KEY_CONTENT`: The content of your App Store Connect API Key (.p8 file)
- `APPLE_CERTIFICATE_CONTENT`: Your iOS Distribution Certificate (base64 encoded)
- `APPLE_CERTIFICATE_PASSWORD`: The password for your iOS Distribution Certificate
- `APPLE_PROVISIONING_PROFILE`: Your iOS Provisioning Profile (base64 encoded)

## Notes

- The Safari iOS extension uses the same web extension code as the Chrome and Firefox extensions
- The iOS app is just a wrapper that enables the Safari extension
- Users need to explicitly enable the extension in Safari settings after installing the app