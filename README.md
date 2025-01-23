# ChronicleSync

A modern, secure IndexedDB synchronization service built with Cloudflare Workers and Pages. ChronicleSync enables seamless data synchronization across browsers and devices while maintaining robust security and offline capabilities.

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Secure**: End-to-end HTTPS encryption and robust access controls
- **Password Manager Integration**: Works seamlessly with 1Password and other password managers
- **Chrome Extension**: Easy-to-use browser integration with dedicated window interface
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- Cloudflare account

### Installation

1. Clone and install dependencies:
```bash
git clone https://github.com/yourusername/chroniclesync.git
cd chroniclesync

# Install dependencies
cd pages && npm install
cd ../worker && npm install
```

2. Start development servers:
```bash
# In pages directory
npm run dev

# In worker directory
npm run dev
```

3. Build Chrome extension:
```bash
cd pages
npm run build:extension
```

### Load Extension in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `/workspace/chroniclesync/extension` directory

## Testing

The project includes unit, integration, and E2E tests:

```bash
# Frontend tests
cd pages && npm run test

# Worker tests
cd worker && npm run test:coverage

# E2E tests (requires Playwright and Xvfb)
cd pages && npm run test:e2e
```

For E2E tests, install prerequisites:
```bash
# Install Playwright
npx playwright install chromium

# Install Xvfb (Linux/WSL only)
sudo apt-get update && sudo apt-get install -y xvfb
```

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Chrome Extension**: Custom window interface with password manager integration
- **Backend**: Cloudflare Worker with serverless architecture

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
