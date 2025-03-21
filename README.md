# ChronicleSync

Sync stuff across browsers

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Not Secure**: I'm to lazy and the models suck too much for local encryption, but it's coming.
- **Multiplatform**: Support for Chrome, Firefox, and Safari browsers
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- GitHub CI/CD
- Cloudflare account for deployments
- Node.js ... Just read the github actions
- Xcode (for Safari extension development and testing)

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application
- [Worker Developer Guide](worker/DEVELOPER.md) - Comprehensive guide for the Cloudflare Worker backend
- [Safari Extension UI Tests](extension/ChronicleSync/ChronicleSync-UITests/README.md) - Guide for Safari extension UI testing

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Browser extensions
│   ├── ...         # Chrome/Firefox extension files
│   └── ChronicleSync/ # Safari extension
│       ├── iOS (App)/        # iOS app container
│       ├── iOS (Extension)/  # iOS extension
│       ├── Shared (App)/     # Shared app code
│       ├── Shared (Extension)/ # Shared extension code
│       └── ChronicleSync-UITests/ # UI tests for Safari extension
└── worker/         # Cloudflare Worker backend
```

### Testing

#### Chrome/Firefox Extension Testing
```bash
cd extension
npm test
```

#### Safari Extension UI Testing
```bash
cd extension/ChronicleSync
./run-uitests.sh
```
