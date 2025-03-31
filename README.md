# ChronicleSync

Sync stuff across browsers

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Not Secure**: I'm to lazy and the models suck too much for local encryption, but it's coming.
- **Multiplatform**: Now with Safari iOS support!
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- GitHub CI/CD
- Cloudflare account for deployments
- Node.js ... Just read the github actions
- Xcode for Safari iOS extension

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Safari Extension Guide](safari-ios/README.md) - Guide for the Safari iOS extension
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application
- [Worker Developer Guide](worker/DEVELOPER.md) - Comprehensive guide for the Cloudflare Worker backend

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Chrome extension
├── safari-ios/     # Safari iOS extension
└── worker/         # Cloudflare Worker backend
```
