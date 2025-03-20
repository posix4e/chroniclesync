# ChronicleSync

Sync your browsing history across devices with ChronicleSync.

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Cross-Platform**: Support for iOS Safari (in progress)
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Development Setup

### Prerequisites

- Node.js (v20 or later)
- npm (v10 or later)
- Xcode (for iOS development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/posix4e/chroniclesync.git
   cd chroniclesync
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Workflow

#### Building the Extension

To build the extension using webpack:

```bash
npm run build
```

This will:
- Bundle JavaScript files
- Process CSS
- Copy static assets
- Output everything to the `dist` directory

#### Building the IPA for iOS Simulator

To build an unsigned IPA for the iOS Simulator:

```bash
npm run build:ipa
```

This will:
1. Build the extension with webpack
2. Copy the built files to the Xcode project
3. Build the iOS app using Xcode
4. Package the app as an IPA file

#### Development Mode

For development with hot reloading:

```bash
npm run dev
```

### Project Structure

```
chroniclesync/
├── src/            # Source files for the extension
│   └── js/         # JavaScript modules
│       ├── utils/  # Utility functions
│       └── db/     # Database operations
├── extension/      # Xcode project for iOS and macOS
├── dist/           # Build output directory
├── pages/          # Frontend React application
└── worker/         # Cloudflare Worker backend
```

### GitHub Actions

The project uses GitHub Actions for CI/CD:

- Automatically builds the extension and IPA on push to main branch
- Runs on pull requests to verify builds
- Creates artifacts for testing

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application
- [Worker Developer Guide](worker/DEVELOPER.md) - Comprehensive guide for the Cloudflare Worker backend
