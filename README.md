# ChronicleSync

A modern, secure IndexedDB synchronization service built with Cloudflare Workers and Pages. ChronicleSync enables seamless data synchronization across browsers and devices while maintaining robust security and offline capabilities.

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Secure**: End-to-end HTTPS encryption and robust access controls
- **Chrome Extension**: Easy-to-use browser integration with dedicated window interface
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- GitHub account with repository access
- Cloudflare account for deployments
- Node.js 18 or later
- npm package manager

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Chrome extension
└── worker/         # Cloudflare Worker backend
```

For detailed setup instructions and development guidelines, please refer to the developer guides above.
