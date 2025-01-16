# ChronicleSync Development Guide

## Architecture Overview

ChronicleSync consists of three main components:

1. **Browser Extensions**
   - Chrome/Edge (Manifest V3)
   - Firefox (Manifest V2)
   - Safari (Manifest V2)

2. **Frontend Application**
   - React-based admin panel
   - Health monitoring interface
   - Client management tools

3. **Cloudflare Worker**
   - Data synchronization service
   - Client authentication
   - Storage management

## Development Environment Setup

### Prerequisites

1. **Required Software**
   - Node.js (>= 16)
   - npm (>= 7)
   - Git
   - For Safari: macOS + Xcode 15.0+

2. **Development Tools**
   - VS Code (recommended)
   - Browser development tools
   - Cloudflare Wrangler CLI

### Initial Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/chroniclesync.git
cd chroniclesync

# Install dependencies
npm install

# Start development server
npm run dev
```

## Browser Extension Development

### Manifest Structure

ChronicleSync uses platform-specific manifest files:

#### Chrome/Edge (`manifest.v3.json`)
```json
{
  "manifest_version": 3,
  "host_permissions": ["https://*.chroniclesync.xyz/*"],
  "action": {...},
  "background": {
    "service_worker": "background.js"
  }
}
```

#### Firefox/Safari (`manifest.v2.json`)
```json
{
  "manifest_version": 2,
  "permissions": [
    "https://*.chroniclesync.xyz/*"
  ],
  "browser_action": {...},
  "background": {
    "scripts": ["background.js"]
  }
}
```

### Build Process

```bash
# Build all extensions
npm run build:extensions

# Platform-specific builds
npm run build:chrome
npm run build:firefox
npm run build:safari

# Validate manifests
npm run validate:manifests
```

### Safari Extension Development

Requirements:
- macOS system
- Xcode 15.0+
- Safari Web Extension converter

Build process:
```bash
# Build Safari extension
npm run package:safari
```

Common issues:
1. Path Resolution
   - Use absolute paths for Safari
   - Update manifest paths accordingly

2. Permission Handling
   - All permissions in `permissions` array
   - Use `browser_action` instead of `action`

3. Background Scripts
   - Must be in `scripts` array
   - No service workers support

## Frontend Development

### React Application

The frontend is built with:
- React 18
- TypeScript
- Vite
- Jest for testing

Structure:
```
src/
├── components/     # React components
├── utils/         # Utility functions
├── types/         # TypeScript types
└── extension/     # Extension-specific code
```

### Development Workflow

1. Start development server:
   ```bash
   npm run dev
   ```

2. Testing:
   ```bash
   # Unit/Integration tests
   npm run test
   npm run test:watch
   
   # E2E tests
   npm run test:e2e
   ```

3. Building:
   ```bash
   # Build web application
   npm run build:web
   
   # Build everything
   npm run build
   ```

## Cloudflare Worker Development

### Worker Structure

```
worker/
├── src/
│   ├── index.js           # Main worker entry
│   ├── services/          # Service modules
│   └── test-setup.js      # Test configuration
```

### Local Development

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Start local worker:
   ```bash
   wrangler dev
   ```

3. Deploy:
   ```bash
   wrangler deploy
   ```

## Testing Strategy

See [TESTING.md](../TESTING.md) for detailed testing methodology.

Quick reference:
```bash
# Run all tests
npm run test

# E2E tests
npm run test:e2e

# Test with coverage
npm run test:coverage
```

## Deployment

### Production Deployment

1. Build all assets:
   ```bash
   npm run build
   ```

2. Deploy web application:
   ```bash
   npm run deploy
   ```

3. Package extensions:
   ```bash
   npm run package:chrome
   npm run package:firefox
   npm run package:safari
   ```

### Staging Deployment

```bash
# Deploy to staging
ENVIRONMENT=staging npm run deploy
```

## Troubleshooting

1. **Build Issues**
   - Clear `node_modules` and reinstall
   - Verify Node.js version
   - Check platform requirements

2. **Extension Problems**
   - Validate manifest files
   - Check browser compatibility
   - Review permissions

3. **Worker Issues**
   - Verify Wrangler configuration
   - Check environment variables
   - Review service bindings

## Additional Resources

- [Testing Guide](../TESTING.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Local Development](LOCAL_DEVELOPMENT.md)
