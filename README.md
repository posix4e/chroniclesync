# ChronicleSync

Sync browsing history and summaries across browsers

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Privacy-Focused**: Only syncs summaries and history information, never stores or syncs full page content
- **Efficient Search**: Search through summaries and history information, not full content
- **P2P Sync**: Directly sync between devices using WebRTC without requiring a central server
- **Cross-Platform**: Compatible with iOS devices through P2P sync
- **End-to-End Encryption**: P2P mode uses shared secret for secure device-to-device communication
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- GitHub CI/CD
- Cloudflare account for deployments
- Node.js ... Just read the github actions

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application

### Project Structure

```
chroniclesync/
├── pages/               # Frontend React application
└── extension/           # Chrome extension
```

### Administration

#### Key Structure
ChronicleSync uses the following key structure:

- **Client IDs**: Base64url-encoded SHA-256 hash of the BIP39 mnemonic (~43 characters)

### P2P Synchronization

ChronicleSync supports peer-to-peer synchronization using WebRTC, allowing direct device-to-device communication without requiring a central server.

#### How P2P Sync Works

1. **Discovery**: Devices connect to a WebSocket discovery service
2. **Connection**: WebRTC establishes a direct connection between devices
3. **Authentication**: Devices authenticate each other using a shared mnemonic phrase
4. **Encryption**: All data is encrypted end-to-end using keys derived from the shared mnemonic
5. **Synchronization**: History entries and device information are exchanged directly between devices

#### Benefits of P2P Sync

- **Privacy**: Data never passes through a central server
- **Cross-Platform**: Works with iOS and other platforms that support WebRTC
- **Offline Capability**: Devices can sync when on the same local network, even without internet access
- **Reduced Server Load**: Minimizes the need for server resources and bandwidth

#### Setting Up P2P Sync

1. Enable P2P sync mode in the extension settings
2. Enter the same mnemonic phrase on all devices you want to sync
3. The extension will automatically connect to the discovery service
4. Start syncing directly between your devices

For iOS devices, implement a WebRTC client that:
1. Connects to the same WebSocket discovery endpoint
2. Uses the same shared mnemonic for authentication and encryption
3. Follows the same WebRTC signaling protocol

