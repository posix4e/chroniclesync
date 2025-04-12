# ChronicleSync

Sync browsing history and summaries across browsers

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Privacy-Focused**: Only syncs summaries and history information, never stores or syncs full page content
- **Efficient Search**: Search through summaries and history information, not full content
- **Not Secure**: I'm to lazy and the models suck too much for local encryption, but it's coming.
- **Multiplatform**: Support for Chrome, Firefox, and now Safari on iOS.
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- GitHub CI/CD
- Cloudflare account for deployments
- Node.js ... Just read the github actions

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application
- [Worker Developer Guide](worker/DEVELOPER.md) - Comprehensive guide for the Cloudflare Worker backend

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Browser extensions (Chrome, Firefox, Safari)
└── worker/         # Cloudflare Worker backend
```

### Extension Builds

The project supports building extensions for multiple browsers:

- **Chrome**: Builds a `.zip` file that can be loaded into Chrome or uploaded to the Chrome Web Store
- **Firefox**: Builds an `.xpi` file that can be loaded into Firefox or submitted to Mozilla Add-ons
- **Safari**: Builds an `.ipa` file for iOS Safari using `xcrun safari-web-extension-converter`

To build the extensions locally:

```bash
# Build Chrome and Firefox extensions
cd extension
npm run build:extension

# Build Safari IPA for iOS
cd extension
npm run build:safari-ipa
```

The Safari IPA generation requires macOS with Xcode installed.

### Administration

#### Key Structure
ChronicleSync uses the following key structure:

- **Client IDs**: Base64url-encoded SHA-256 hash of the BIP39 mnemonic (~43 characters)
- **KV Storage**: Keys are the client IDs directly
- **R2 Storage**: Keys follow the pattern `${clientId}/d` for client data

