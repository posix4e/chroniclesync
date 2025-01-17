# ChronicleSync

ChronicleSync is your go-to tool for syncing browser data across devices. Simple, fast, and reliable.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Quick Start](#quick-start)
4. [Browser Extension](#browser-extension)
5. [For Developers](#for-developers)
6. [Help and Support](#help-and-support)
7. [License](#license)

---

## Overview

ChronicleSync works across multiple platforms, including Chrome, Firefox, and Safari. It helps you keep your data consistent, whether you're offline or switching between devices. No more manual transfers—just smooth syncing.

---

## Core Features

- **Offline-First**: Work offline without interruptions. Sync happens automatically when you're back online.
- **Manual Sync**: Need control? Sync your data on demand.
- **Secure by Design**: Uses HTTPS to keep your data private and safe.
- **Admin Tools**: Effortlessly monitor and manage data.

---

## Quick Start

ChronicleSync is easy to use whether you're a casual user or a developer. Here's how to get started:

### Browser Extension

Install ChronicleSync for your favorite browser:
- **Chrome**: Download the extension and add it to your browser.
- **Firefox**: Grab the Firefox version and follow the setup.
- **Safari**: Install the Safari version from the releases page.

### Developers: NPM Package

Integrate ChronicleSync into your project:
```bash
npm install chroniclesync
```

---

## For Developers

### Development Setup
For a comprehensive guide on setting up the development environment and running tests, see our [OpenHands Setup Guide](OPENHANDS_SETUP.md).

### Start Syncing

#### Initialize the Client
```javascript
import { initializeClient } from 'chroniclesync';

// Start with your unique client ID
await initializeClient('your-client-id');
```

#### Save Data Locally
```javascript
await saveData({
  notes: 'Meeting notes',
  timestamp: new Date(),
});
```

#### Sync Data
```javascript
await syncData();
```

---

## Help and Support

Need help? We’re here for you:
- **Issues**: [Report problems here](https://github.com/posix4e/chroniclesync/issues).
- **Docs**: Check out the [DEVELOPMENT.md](pages/DEVELOPMENT.md) file for more details.

---

## License

MIT © [OpenHands]

---

ChronicleSync: Simplify your data syncing. Enjoy the freedom of seamless browsing.

