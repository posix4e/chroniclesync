# ChronicleSync

A modern, secure IndexedDB synchronization service built with Cloudflare Workers and Pages. ChronicleSync enables seamless data synchronization across browsers and devices while maintaining robust security and offline capabilities.

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Secure**: End-to-end HTTPS encryption and robust access controls
- **Chrome Extension**: Easy-to-use browser integration with dedicated window interface
- **Real-time Monitoring**: Health monitoring and administrative dashboard
- **History Sync**: Comprehensive synchronization of browsing history across devices with conflict resolution and merge capabilities

## Development

### Prerequisites
- GitHub account with repository access
- Cloudflare account for deployments
- Node.js 18 or later
- npm package manager

### Local Development Setup
Checkout the github actions for info on building it


### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
│   ├── src/        # Source code
│   └── e2e/        # End-to-end tests for pages
├── extension/      # Chrome extension
│   ├── src/        # Extension source code
│   └── e2e/        # End-to-end tests for extension
└── worker/         # Cloudflare Worker backend
```
