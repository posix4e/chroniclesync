# ChronicleSync

A modern, secure IndexedDB synchronization service built with Cloudflare Workers and Pages. ChronicleSync enables seamless data synchronization across browsers and devices while maintaining robust security and offline capabilities.

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Secure**: End-to-end encryption using BIP32 seed phrases and AES-GCM for history data, plus HTTPS transport encryption
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
- [Worker Developer Guide](worker/DEVELOPER.md) - Comprehensive guide for the Cloudflare Worker backend

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Chrome extension
└── worker/         # Cloudflare Worker backend
```

For detailed setup instructions and development guidelines, please refer to the developer guides above.

## Security and Encryption

ChronicleSync uses a robust encryption system to protect your history data:

- **Client-Side Encryption**: All history data is encrypted on your device before being stored or synced
- **BIP32 Seed Phrase**: Your encryption key is derived from the same BIP32 seed phrase used for authentication
- **AES-GCM Encryption**: Uses the industry-standard AES-GCM algorithm for secure encryption
- **Unique IVs**: Each piece of data is encrypted with a unique initialization vector (IV)
- **Zero-Knowledge**: The server never has access to your unencrypted data or encryption keys

### Recovery

Since the encryption key is derived from your BIP32 seed phrase, you can recover your encrypted data by:
1. Installing ChronicleSync on a new device
2. Entering your existing seed phrase
3. The extension will automatically derive the same encryption key and decrypt your data

### Technical Details

- Encryption algorithm: AES-GCM with 256-bit keys
- Key derivation: SHA-256 hash of BIP32 mnemonic
- IV: 12 bytes of cryptographically secure random data per encryption
- Encrypted fields: URL, title, platform, and browser information
