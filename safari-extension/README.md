# ChronicleSync Safari Extension

This directory contains the Safari extension for ChronicleSync, which allows you to use ChronicleSync with Safari on iOS and macOS.

## Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Step-by-step instructions for setting up the Safari extension
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Solutions for common issues with the Safari extension

## Safari Extension Structure

The Safari extension consists of two components:
1. **Container App** (`com.chroniclesync.ChronicleSync`): The iOS app that users install from the App Store
2. **Safari Web Extension** (`com.chroniclesync.ChronicleSync.Extension`): The extension that runs within Safari

Both components need to be signed with a provisioning profile that includes the appropriate entitlements.

## Building the Extension

The Safari extension is built using the Chrome extension as a base, with additional configuration for Safari.

### Prerequisites

- Xcode 14.0 or later
- Apple Developer account
- Node.js and npm
- Provisioning profile that covers both the app and extension bundle IDs

### Build Process

1. Build the Chrome extension first:
```bash
cd ../extension
npm ci
npm run build
npm run build:extension
```

2. Build the Safari extension:
```bash
cd ../safari-extension
./build-safari-extension.sh
```

## Testing

You can test the Safari extension using:

```bash
./test-safari-extension.sh
```

This will build the extension and launch it in the iOS Simulator.

## CI/CD

The Safari extension is built and tested as part of the CI/CD pipeline. See the GitHub workflow file for details.