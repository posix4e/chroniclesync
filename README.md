# ChronicleSync

Sync stuff across browsers

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Not Secure**: I'm to lazy and the models suck too much for local encryption, but it's coming.
- **Multiplatform**: Now with support for Chrome, Firefox, and Safari (including iOS)!
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- GitHub CI/CD
- Cloudflare account for deployments
- Node.js ... Just read the github actions

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Multi-Platform Extension Guide](extension/MULTIPLATFORM.md) - Guide for building and testing on Chrome, Firefox, and Safari
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application
- [Worker Developer Guide](worker/DEVELOPER.md) - Comprehensive guide for the Cloudflare Worker backend

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Browser extension (Chrome, Firefox, Safari)
└── worker/         # Cloudflare Worker backend
```

### Building and Testing Extensions

```bash
# Build extensions for all platforms
cd extension
npm run build:all

# Run tests on specific platforms
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### CI/CD Workflows

The repository includes GitHub Actions workflows for each platform:
- Chrome Extension CI/CD
- Firefox Extension CI/CD
- Safari Extension CI/CD

These workflows build and test the extension on each platform.
