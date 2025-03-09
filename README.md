# ChronicleSync

Sync your browsing history across browsers and devices

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Cross-Platform**: Support for Chrome, Firefox, and iOS Safari
- **Seamless Synchronization**: Sync your data across all your devices
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- GitHub CI/CD
- Cloudflare account for deployments
- Node.js 20 or later
- Xcode 14 or later (for Safari iOS development)

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application
- [Worker Developer Guide](worker/DEVELOPER.md) - Comprehensive guide for the Cloudflare Worker backend
- [Cross-Platform Guide](CROSS_PLATFORM.md) - Guide for cross-platform development and testing

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Chrome extension
├── worker/         # Cloudflare Worker backend
├── shared/         # Shared code across all platforms
├── platforms/      # Platform-specific code
│   ├── chrome/     # Chrome-specific code
│   ├── firefox/    # Firefox-specific code
│   └── safari-ios/ # Safari iOS-specific code
└── e2e/            # End-to-end tests
```

## Cross-Platform Support

ChronicleSync now supports multiple platforms:

- **Chrome**: Available on the Chrome Web Store
- **Firefox**: Available on Firefox Add-ons
- **iOS Safari**: Available on the Apple App Store

For detailed instructions on building, testing, and deploying across platforms, see the [Cross-Platform Guide](CROSS_PLATFORM.md).
