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

### Bundle Identifier

The default bundle identifier is `xyz.chroniclesync.app` with the extension bundle identifier being `xyz.chroniclesync.app.extension`. You can override this by setting the `APPLE_APP_ID` environment variable:

```bash
export APPLE_APP_ID="your.custom.bundle.identifier"
```

The build script will automatically update all necessary files with the correct bundle identifier.

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
- Updates bundle identifiers in Info.plist files and export options
- Builds the Chrome/Firefox extension
- Copies the necessary files to the Safari extension
- Validates the extension files

3. Open the Xcode project:

```bash
open ChronicleSync.xcodeproj
```

4. Select the target you want to build (iOS or macOS) and click the Run button.

### Building for Distribution

To build for distribution, you'll need to set up the following environment variables:

```bash
export APPLE_APP_ID="xyz.chroniclesync.app"
export APPLE_TEAM_ID="your_team_id"
export APPLE_CERTIFICATE_PASSWORD="your_certificate_password"
```

Then run the build script and use Xcode to archive and export the app:

### Linting

The project uses SwiftLint to ensure code quality. The linting rules are defined in `.swiftlint.yml`.

To run SwiftLint manually:

```bash
cd extension/safari
npm run lint
```

Or from the main extension directory:

```bash
npm run lint:safari
```

To run all linting (both JavaScript and Swift):

```bash
npm run lint:all
```

Additional npm scripts are available:

```bash
# Fix auto-fixable linting issues
npm run lint:fix

# Run linting in strict mode (used in CI/CD)
npm run lint:strict
```

The CI/CD pipeline runs SwiftLint in strict mode to catch any issues.

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