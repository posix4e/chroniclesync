# ChronicleSync Safari Extension

This is the Safari iOS extension for ChronicleSync, allowing you to sync your browsing history across devices.

## Features

- Sync browsing history across devices
- View and search your browsing history
- Secure and private synchronization

## Development Setup

### Prerequisites

- Xcode 15.0 or later
- iOS 16.0 or later
- Node.js 20 or later
- npm

### Installation

1. Clone the repository
2. Navigate to the safari-extension directory
3. Install dependencies:

```bash
npm install
```

4. Build the extension:

```bash
npm run build
```

5. Open the Xcode project:

```bash
open ChronicleSync/ChronicleSync.xcodeproj
```

6. Build and run the project in Xcode

### Testing

To run the unit tests:

```bash
npm run test
```

To run the iOS tests:

```bash
npm run test:ios
```

## Project Structure

- `ChronicleSync/` - Xcode project for the Safari extension
- `src/` - Source code for the extension
- `scripts/` - Build scripts
- `dist/` - Build output

## License

See the main repository license file.