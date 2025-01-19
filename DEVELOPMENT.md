# ChronicleSync Development Documentation

Internal development documentation for OpenHands team.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- npm 8 or higher
- Chrome browser
- Git

### Initial Setup
1. Clone the repository
2. Set up each component:

```bash
# Set up Pages
cd pages
npm install
npm run build

# Set up Worker
cd ../worker
npm install
npm run build

# Set up Extension
cd ../extension
npm install
npm run build
```

### Development Workflow

#### Building Components

1. Pages:
```bash
cd pages
npm run build
```

2. Worker:
```bash
cd worker
npm run build
```

3. Extension:
```bash
cd extension
npm run build
```

Note: Running development servers locally is not recommended as they require an interactive terminal and specific environment setup. Instead, use the staging environment for testing.

#### Testing

Each component has its own test suite:

```bash
# Pages Tests
cd pages
npm test
npm run test:e2e

# Worker Tests
cd worker
npm test

# Extension Tests
cd extension
npm test
```

For staging environment tests:
```bash
cd extension
npm run test:e2e:staging
```

## Architecture Overview

### Component Architecture

1. **Chrome Extension**
   - Minimal popup window with launch button
   - Main application in separate window for password manager support
   - Background script for extension lifecycle management
   - Content scripts for page interaction

2. **Pages Application**
   - React-based frontend
   - Server-side rendering for better SEO
   - API endpoints for data synchronization
   - Admin interface for system management

3. **Worker Service**
   - Background sync service
   - IndexedDB management
   - Data processing and validation
   - Health monitoring

### Technology Stack

1. **Extension**
   - Manifest V3
   - TypeScript
   - React for UI
   - Chrome Extension APIs

2. **Pages**
   - Next.js for SSR
   - TypeScript
   - Tailwind CSS
   - API Routes

3. **Worker**
   - Node.js
   - TypeScript
   - IndexedDB
   - WebSocket for real-time sync

### Security Implementation

1. **Extension Security**
   - Manifest V3 security features
   - Minimal popup with separate main window
   - Password manager support
   - Content script isolation
   ```javascript
   // manifest.json
   {
     "content_security_policy": {
       "extension_pages": "script-src 'self'; object-src 'self'",
       "sandbox": "sandbox allow-scripts allow-forms allow-popups"
     }
   }
   ```

2. **Pages Security**
   - Content Security Policy (CSP)
   - Subresource Integrity (SRI)
   - CORS configuration
   ```javascript
   // next.config.js
   {
     async headers() {
       return [{
         source: '/:path*',
         headers: [
           {
             key: 'Content-Security-Policy',
             value: "default-src 'self'; script-src 'self'"
           }
         ]
       }]
     }
   }
   ```

3. **Worker Security**
   - Origin validation
   - Request authentication
   - Data encryption
   ```javascript
   const allowedOrigins = [
     'https://chroniclesync.xyz',
     'https://staging.chroniclesync.xyz'
   ];
   ```

### Known Issues & Solutions

1. **Extension Window Management**
   - Issue: Chrome extensions have limited window management
   - Solution: Use `chrome.windows.create` with specific parameters
   ```javascript
   chrome.windows.create({
     url: 'app.html',
     type: 'popup',
     width: 800,
     height: 600
   });
   ```

2. **Password Manager Integration**
   - Issue: Password managers don't work in extension popups
   - Solution: Move main UI to separate window
   - Note: Test with popular password managers

3. **Cross-Origin Communication**
   - Issue: Extension, Pages, and Worker communication
   - Solution: Proper CORS and message passing setup
   ```javascript
   // Extension to Pages communication
   chrome.runtime.sendMessage({
     target: 'pages',
     action: 'sync',
     data: payload
   });
   ```

### Environment Configuration

1. **Development**
   - Extension: `chrome://extensions` (unpacked)
   - Pages: `http://localhost:50800`
   - Worker: `http://localhost:55440`
   - Debug logging enabled
   - Hot reload active

2. **Staging**
   - Extension: Chrome Web Store (beta channel)
   - Pages: `staging.chroniclesync.xyz`
   - Worker: `worker.staging.chroniclesync.xyz`
   - E2E tests enabled
   - Monitoring active

3. **Production**
   - Extension: Chrome Web Store (stable)
   - Pages: `chroniclesync.xyz`
   - Worker: `worker.chroniclesync.xyz`
   - Full security measures
   - Performance monitoring

### Testing Strategy

1. **Unit Tests**
   - Component-specific tests
   - Security validation
   - API contract tests
   ```bash
   # Run component tests
   cd component-dir && npm test
   ```

2. **Integration Tests**
   - Cross-component communication
   - Data flow validation
   - Security integration
   ```bash
   npm run test:integration
   ```

3. **E2E Tests**
   - Full user journey testing
   - Browser extension testing
   - Staging environment validation
   ```bash
   npm run test:e2e:staging
   ```

### Deployment Checklist

1. **Pre-deployment**
   - Run all test suites
   - Check security configurations
   - Verify environment variables
   - Test password manager compatibility

2. **Deployment**
   - Deploy Pages updates
   - Deploy Worker service
   - Submit extension update
   - Update documentation

3. **Post-deployment**
   - Run staging E2E tests
   - Monitor error rates
   - Check performance metrics
   - Verify security headers

### Internal Notes

- Keep components loosely coupled
- Document all cross-component communication
- Regular security audits
- Test with various password managers
- Monitor extension performance
- Keep documentation updated