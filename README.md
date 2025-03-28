# ChronicleSync

Sync stuff across browsers

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Not Secure**: I'm to lazy and the models suck too much for local encryption, but it's coming.
- **Multiplatform**: Now with iOS Safari support!
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- GitHub CI/CD
- Cloudflare account for deployments
- Node.js ... Just read the github actions

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application
- [Worker Developer Guide](worker/DEVELOPER.md) - Comprehensive guide for the Cloudflare Worker backend

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Chrome extension
│   └── ios-tests/  # iOS Safari extension
└── worker/         # Cloudflare Worker backend
```

## iOS Safari Extension Development

### Debugging iOS Safari Extension with GitHub Artifacts

Since OpenHands AI cannot directly run macOS or iOS simulators, you can use the following GitHub artifacts for debugging:

1. **iOS Build Logs**: Contains detailed build output to diagnose compilation issues
2. **iOS Test Logs**: Shows test execution logs and any test failures
3. **iOS Screenshots**: Contains screenshots captured during UI tests
4. **iOS Test Results**: The full Xcode test results bundle
5. **iOS Extension Files**: Key extension source files and resources for code review

To debug iOS issues with OpenHands:

```
Ask OpenHands to:
1. "Check the iOS build logs for compilation errors"
2. "Examine the iOS test logs to identify test failures"
3. "Review the iOS screenshots to verify UI rendering"
4. "Analyze the extension files to identify code issues"
5. "Suggest fixes based on the error messages in the logs"
```

### Self-Signed IPA Creation in CI

The workflow creates a self-signed IPA for debugging purposes:

1. Generates a self-signed certificate using OpenSSL
2. Configures the Xcode project to use this certificate
3. Builds and archives the app with the self-signed certificate
4. Exports the archive as an IPA with ad-hoc distribution method

**Note:** This self-signed IPA is for debugging purposes only and cannot be installed on physical devices without proper Apple Developer provisioning. However, it provides a complete package of the extension for inspection and analysis.

If the self-signed IPA creation fails, the workflow will:
1. Create a fallback package with the extension source files
2. Include any available archive contents
3. Generate detailed debug information

#### Apple Developer Signing

The workflow uses Apple Developer credentials from GitHub secrets to create properly signed IPAs:

1. The following secrets are used from your GitHub repository:
   - `APPLE_TEAM_ID`: Your Apple Developer Team ID
   - `APPLE_CERTIFICATE_CONTENT`: Base64-encoded P12 certificate
   - `APPLE_CERTIFICATE_PASSWORD`: Password for the P12 certificate
   - `APPLE_PROVISIONING_PROFILE`: Base64-encoded provisioning profile
   - `APPLE_API_KEY_ID`: Apple API Key ID for App Store Connect API
   - `APPLE_API_KEY_ISSUER_ID`: Apple API Key Issuer ID
   - `APPLE_API_KEY_CONTENT`: Base64-encoded Apple API Key
   - `APPLE_APP_ID`: Your app's ID in App Store Connect

2. The workflow automatically detects these secrets and uses them for signing

This allows the workflow to create properly signed IPAs that can be installed on registered test devices or submitted to TestFlight.

To properly sign and distribute the iOS extension for real devices, you'll need:
- An Apple Developer account
- Proper code signing certificates and provisioning profiles
- A local macOS environment with Xcode
