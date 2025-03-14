# ChronicleSync Safari iOS Extension

This directory contains the Safari iOS extension for ChronicleSync.

## Development

### Prerequisites

- For local development and testing:
  - Any operating system with Node.js
  - Zip utility installed

- For building a real iOS app:
  - macOS with Xcode 14.0 or later
  - iOS 15.0 or later
  - Apple Developer Account with Safari Extension capabilities

### Building the Extension

#### On macOS (for real device testing)

1. Open the `ChronicleSync.xcodeproj` file in Xcode
2. Configure your development team in the Signing & Capabilities section
3. Build and run the project on a simulator or device

#### On any platform (for CI/CD purposes)

1. Run `npm run build:safari-ios` from the extension directory
2. This will create a `safari-ios-extension.ipa` file

**Note:** When built on Linux or Windows, the resulting `.ipa` file is not a real iOS app package. It's just a zip file with the extension source code, intended for CI/CD purposes only. A proper IPA file can only be created on macOS with Xcode and proper code signing.

### Testing with TestFlight

The extension is automatically built and uploaded to TestFlight when changes are merged to the main branch. To test the extension:

1. Ensure you are added as a TestFlight tester for the app
2. Install the TestFlight app on your iOS device
3. Accept the invitation to test the ChronicleSync app
4. Install the app from TestFlight
5. Open the app and follow the instructions to enable the Safari extension

## Cross-Platform Development Workflow

The recommended workflow is:

1. Develop and test the core extension functionality on Chrome or Firefox
2. Use the GitHub Actions workflow to build and deploy to TestFlight for iOS testing
3. If you have access to a Mac, you can build and test locally with Xcode

The build script (`build-safari-ios-extension.sh`) will detect your platform and provide appropriate warnings and instructions.

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