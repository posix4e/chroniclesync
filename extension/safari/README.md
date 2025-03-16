# ChronicleSync Safari Extension

This directory contains the Safari extension implementation for ChronicleSync, supporting both macOS and iOS platforms.

## Project Structure

- `iOS/`: iOS app implementation
- `macOS/`: macOS app implementation
- `iOS Extension/`: Safari extension for iOS
- `macOS Extension/`: Safari extension for macOS
- `Shared/`: Shared resources between iOS and macOS
  - `Extension Files/`: The actual extension code (shared with Chrome/Firefox)
- `Tests/`: Test files for iOS and macOS

## Building the Extension

### Prerequisites

- Xcode 13 or later
- macOS 11 or later
- Apple Developer account (for signing and distribution)
- SwiftLint (optional, for code linting)

### Build Steps

1. Install SwiftLint (optional):

```bash
brew install swiftlint
```

2. Build the extension files:

```bash
./build-safari-extension.sh
```

This script:
- Runs SwiftLint to check code quality (if installed)
- Builds the Chrome/Firefox extension
- Copies the necessary files to the Safari extension
- Validates the extension files

3. Open the Xcode project:

```bash
open ChronicleSync.xcodeproj
```

4. Select the target you want to build (iOS or macOS) and click the Run button.

### Linting

The project uses SwiftLint to ensure code quality. The linting rules are defined in `.swiftlint.yml`.

To run SwiftLint manually:

```bash
cd extension/safari
swiftlint lint
```

The CI/CD pipeline also runs SwiftLint in strict mode to catch any issues.

## Enabling the Extension in Safari

### macOS

1. Open Safari
2. Go to Safari > Preferences > Extensions
3. Enable the ChronicleSync extension

### iOS

1. Open the Settings app
2. Go to Safari > Extensions
3. Enable the ChronicleSync extension

## Testing

The project includes basic test targets for both iOS and macOS. You can run these tests from Xcode by selecting the test target and clicking the Run button.

## CI/CD

The CI/CD workflow includes building and testing the Safari extension on a macOS runner. The workflow:

1. Builds the extension files
2. Builds the macOS and iOS apps
3. Runs the tests
4. Creates distributable packages

## Distribution

To distribute the extension:

1. For macOS: Submit the app to the Mac App Store
2. For iOS: Submit the app to the iOS App Store

Both apps should be submitted with the Safari extension included.