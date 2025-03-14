# ChronicleSync

Sync stuff across browsers

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Secure**: Local encryption for your data (coming soon)
- **Multiplatform**: Support for Chrome, Firefox, and Safari (iOS/macOS)
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- GitHub CI/CD
- Cloudflare account for deployments
- Node.js ... Just read the github actions
- For iOS/Safari development: macOS with Xcode 14+

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Safari Extension Guide](extension/SAFARI_EXTENSION.md) - Guide for building and testing the Safari extension
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application
- [Worker Developer Guide](worker/DEVELOPER.md) - Comprehensive guide for the Cloudflare Worker backend

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Browser extension (Chrome, Firefox, Safari)
│   ├── scripts/    # Build and test scripts
│   └── e2e/        # End-to-end tests including iOS Safari
└── worker/         # Cloudflare Worker backend
```
