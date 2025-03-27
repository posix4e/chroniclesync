# ChronicleSync Safari Extension for iOS

This directory contains the Safari extension version of ChronicleSync for iOS devices.

## Structure

- `ChronicleSync/` - The main iOS app that hosts the Safari extension
  - `ChronicleSync/` - iOS app source code
  - `ChronicleSync Extension/` - Safari extension source code
  - `ChronicleSync Tests/` - iOS and Safari extension tests

## Building the Extension

### Prerequisites

- Xcode 14.2 or later
- iOS 16.0 SDK or later
- Node.js 20 or later
- npm

### Build Steps

1. Build the JavaScript files:

```bash
# From the extension directory
npm run build
```

2. Copy the built files to the Safari extension:

```bash
# From the extension directory
npm run build:all
```

3. Build the iOS app:

```bash
# From the extension directory
npm run build:safari
```

## Testing

To run the iOS tests:

```bash
# From the extension directory
npm run test:ios
```

This will:
1. Launch the iOS simulator
2. Install the ChronicleSync app
3. Run the test suite
4. Capture screenshots during test execution
5. Save test results to `extension/safari/ChronicleSync/TestResults`

## Cross-Platform Support

The extension is designed to work on both Chrome and Safari platforms. It uses:

- Platform detection utilities in `src/utils/platform.ts`
- Browser API abstraction in `src/utils/browser-api.ts`

These utilities allow the same codebase to run on both platforms with minimal platform-specific code.

## CI/CD Integration

The extension is integrated with GitHub Actions for continuous integration and deployment:

- JavaScript tests run on every push and pull request
- iOS tests run when changes are made to the Safari extension
- Test screenshots are uploaded as artifacts for review