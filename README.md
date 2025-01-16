# ChronicleSync

ChronicleSync is a powerful IndexedDB synchronization service built with Cloudflare Workers and Pages, enabling seamless client-side data synchronization across browsers and devices.

## 🌟 Features

- 📱 **Offline-First Architecture**
  - Work seamlessly offline
  - Automatic background sync when online
  - Conflict resolution strategies

- 🔄 **Cross-Browser Support**
  - Chrome/Chromium-based browsers (Manifest V3)
  - Firefox (Manifest V2)
  - Safari (Manifest V2)

- 🔒 **Security & Privacy**
  - End-to-end HTTPS encryption
  - Fine-grained access controls
  - Secure client authentication

- 📊 **Administration**
  - Comprehensive admin panel
  - Real-time monitoring
  - Client data management

## 🚀 Quick Start

### Browser Extension Installation

#### Chrome/Edge
1. Download `chroniclesync-chrome.zip` from [Releases](https://github.com/posix4e/chroniclesync/releases)
2. Visit `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select extracted folder

#### Firefox
1. Download `chroniclesync-firefox.zip`
2. Visit `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on" → select zip

#### Safari
1. Download `chroniclesync-safari.zip`
2. Extract and double-click `.app` file
3. Enable in Safari Preferences → Extensions

### API Usage

```javascript
// Initialize client
await initializeClient('your-client-id');

// Save data locally
await saveData({
  notes: 'Meeting notes',
  timestamp: new Date()
});

// Manual sync
await syncData();
```

## 📚 Documentation

- [Development Guide](pages/DEVELOPMENT.md) - Setup and development workflow
- [Testing Guide](TESTING.md) - Comprehensive testing methodology
- [Local Development](pages/LOCAL_DEVELOPMENT.md) - Local setup instructions
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute

## 🛠️ Development Setup

1. Prerequisites:
   - Node.js and npm
   - For Safari: macOS + Xcode 15.0+

2. Installation:
   ```bash
   npm install
   ```

3. Development Server:
   ```bash
   npm run dev
   ```

4. Testing:
   ```bash
   # E2E tests
   npm run test:e2e
   
   # Unit/Integration tests
   npm run test
   ```

## 🏗️ Project Structure

```
chroniclesync/
├── pages/              # Frontend & Extension code
│   ├── src/           # Source code
│   ├── e2e/           # E2E tests
│   └── scripts/       # Build scripts
├── worker/            # Cloudflare Worker
│   └── src/           # Worker source code
└── scripts/           # Utility scripts
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 🐛 Common Issues

1. **Sync Issues**
   - Check internet connectivity
   - Verify client ID
   - Ensure valid JSON data

2. **Extension Loading**
   - Verify browser compatibility
   - Check manifest version
   - Clear browser cache

3. **Development Setup**
   - Node.js version compatibility
   - Dependencies installation
   - Browser-specific requirements

## 🆘 Support

- GitHub Issues: [Open an issue](https://github.com/posix4e/chroniclesync/issues)
- Documentation: See [Development Guide](pages/DEVELOPMENT.md)

## 📄 License

MIT © [OpenHands]
