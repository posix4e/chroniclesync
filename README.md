# ChronicleSync

A modern, secure IndexedDB synchronization service built with Cloudflare Workers and Pages. ChronicleSync enables seamless data synchronization across browsers and devices while maintaining robust security and offline capabilities.

## 🌟 Features

- 📱 **Offline-First Architecture**
  - Continue working without internet connection
  - Automatic conflict resolution
  - Background synchronization when online

- 🔒 **Enterprise-Grade Security**
  - End-to-end HTTPS encryption
  - Robust access controls
  - Password manager integration
  - Secure cross-device authentication

- 🎯 **Key Capabilities**
  - Manual synchronization control
  - Real-time health monitoring
  - Administrative dashboard
  - Cross-browser compatibility
  - Chrome extension support
  - Browser history synchronization
  - Offline history tracking

## 🏗️ Architecture

ChronicleSync consists of three main components:

1. **Frontend (Pages)**
   - React-based web application
   - Admin panel interface
   - Health monitoring dashboard
   - TypeScript for type safety
   - Vite for optimal build performance

2. **Chrome Extension**
   - Seamless browser integration
   - Dedicated window interface
   - Password manager integration
   - Direct IndexedDB management
   - Optimized for 1Password and other password managers
   - Real-time history synchronization
   - History API integration (pushState, replaceState)
   - Offline history tracking and merge

3. **Backend (Cloudflare Worker)**
   - Serverless architecture
   - Efficient data synchronization
   - Metadata management
   - Security middleware

### History Architecture

The history synchronization system is built on several key components:

1. **Background Service**
   - Service worker-based background script
   - Real-time history event monitoring
   - Cross-browser state management
   - Conflict resolution for concurrent updates

2. **History Management**
   - Full History API integration
   - IndexedDB-based storage
   - Offline-first approach
   - Automatic state reconciliation
   - Cross-browser synchronization

3. **Testing Infrastructure**
   - Comprehensive unit tests for sync logic
   - Visual regression testing
   - Multi-browser scenario testing
   - Network condition simulation
   - Automated screenshot comparisons

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm package manager
- Cloudflare account for deployment

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chroniclesync.git
   cd chroniclesync
   ```

2. Install dependencies:
   ```bash
   # Install Pages dependencies
   cd pages
   npm install

   # Install Worker dependencies
   cd ../worker
   npm install
   ```

3. Configure environment variables:
   - Set up Cloudflare credentials
   - Configure deployment settings

### Development

1. Start the development server:
   ```bash
   # In the pages directory
   npm run dev

   # In the worker directory
   npm run dev
   ```

2. Build the Chrome extension:
   ```bash
   cd pages
   npm run build:extension
   ```

## 🧪 Testing

ChronicleSync includes comprehensive testing across all components:

### Prerequisites
For E2E tests, you need:

1. Build the extension first:
```bash
cd pages
npm run build:extension
```

2. Playwright browsers:
```bash
npx playwright install chromium
```

3. X Virtual Frame Buffer (Xvfb) for running tests in environments without a display server:
```bash
# On Debian/Ubuntu
sudo apt-get install -y xvfb libevent-2.1*

# On CentOS/RHEL
sudo yum install -y xorg-x11-server-Xvfb

# On macOS (not needed as it has a display server)
# No installation required

# On Windows (WSL)
sudo apt-get install -y xvfb
```

⚠️ IMPORTANT TESTING REQUIREMENTS:
1. ALWAYS build the extension before running tests
2. NEVER use headless mode (it breaks extension functionality)
3. ALWAYS use Xvfb for environments without a display server
4. Visual tests require a display server for screenshot comparisons

To run tests with Xvfb:
```bash
# Build extension first
cd pages
npm run build:extension

# Then run tests with Xvfb
xvfb-run npm run test:e2e

# Run tests in watch mode
xvfb-run npm run test:e2e -- --watch
```

Note: Xvfb is required because:
1. The Chrome extension opens in a new window
2. Visual tests need to capture screenshots
3. Password manager integration requires a display server
4. Running in headless mode would break these functionalities

### Running Tests
```bash
# Run frontend tests (React components and utilities)
cd pages
npm run test

# Run worker tests with coverage report
cd worker
npm run test:coverage

# Run E2E tests (Chrome extension)
cd pages
npm run test:e2e
```

### Manual Testing

The extension requires manual testing for password manager integration:

1. Build and load the extension:
```bash
cd pages
npm run build:extension

# In Chrome:
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the /workspace/chroniclesync/extension directory
```

2. Test window behavior:
   - Click extension icon
   - Verify window opens (not popup)
   - Window should be 400x600 pixels
   - Window should appear on right side of screen
   - Content should be properly styled and centered

3. Test password manager integration:
   - Open extension window
   - Verify password manager icon appears in password field
   - Test autofill with 1Password or other password managers
   - Verify form submission works with autofilled credentials


### Test Coverage
- Frontend: Unit tests for React components, hooks, and utility functions
- Worker: 99.5% statement coverage, testing API endpoints, middleware, and services
- E2E: Chrome extension functionality and React app integration tests
- Visual Testing: Automated screenshots for history sync verification

#### Visual Testing
The test suite includes automated visual testing with screenshots captured at key points:

1. Browser History Sync:
   - Initial history state in both browsers
   - Offline state showing divergent histories
   - Final state after history merge
   - Screenshots stored in `test-results/browser-history/`

2. History API Integration:
   - Initial history state
   - State after back/forward navigation
   - State after pushState/replaceState operations

Screenshots are automatically generated during test runs and can be found in:
```
test-results/
├── browser-history/
│   ├── browser1-initial-history.png
│   ├── browser2-initial-history.png
│   ├── browser1-offline-state.png
│   ├── browser2-offline-state.png
│   ├── browser1-after-merge.png
│   └── browser2-after-merge.png
├── history-api-initial.png
└── history-api-after-back.png
```

These screenshots help verify:
- Correct history display across browsers
- Proper handling of offline/online states
- Visual consistency of history entries
- Navigation state visualization

## 🔄 CI/CD

### Deployment Strategy

1. **Frontend (Pages)**
   - Production: Deploys from `main` branch to main environment
   - Feature Branches: Each PR gets its own preview deployment
     ```bash
     # For main branch
     npm run deploy -- --branch main
     # For feature branches
     npm run deploy -- --branch $BRANCH_NAME
     ```
   - Preview URLs follow the pattern: `https://$BRANCH_NAME.chroniclesync.pages.dev`

2. **Backend (Worker)**
   - Production: Deploys from `main` branch to `api.chroniclesync.xyz`
   - Staging: All feature branches deploy to shared staging environment
   - Staging API endpoint: `api-staging.chroniclesync.xyz`
   ```bash
   # For main branch
   npm run deploy -- --env production
   # For feature branches
   npm run deploy -- --env staging
   ```

### Automated Workflow

- Linting and unit testing for all components
- Chrome extension packaging and artifact storage
- Branch-specific Pages deployments
- Shared staging Worker deployment
- E2E testing against staging environment
- Test reports and screenshot preservation

### ⚠️ Important CI Considerations

1. **Wrangler in CI Environment**
   - The project is configured to avoid running `wrangler dev` directly in CI pipelines
   - Wrangler expects an interactive console which causes issues in CI environments
   - CI uses pre-deployed staging environments for E2E tests
   - Required environment variables:
     - `STAGING_URL` and `STAGING_WORKER_URL` for E2E tests
     - `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` for deployments

2. **Extension Testing in CI**
   - The Chrome extension requires a display server for testing window interactions
   - CI environments typically don't have a display server installed
   - Install and use Xvfb in CI pipelines:
     ```yaml
     # Example GitHub Actions workflow step
     - name: Install Xvfb
       run: |
         sudo apt-get update
         sudo apt-get install -y xvfb

     - name: Run E2E tests
       run: xvfb-run npm run test:e2e
     ```
   - This setup is crucial for testing password manager integration and window behavior
   - Alternative: Use headless mode with `playwright.config.ts`, but this limits testing capabilities

3. **Existing CI Configurations**
   - Playwright is configured with CI-specific settings:
     ```typescript
     // playwright.config.ts
     forbidOnly: !!process.env.CI,  // No exclusive tests in CI
     retries: process.env.CI ? 2 : 0,  // Auto-retry in CI
     workers: process.env.CI ? 1 : undefined,  // Single worker in CI
     ```
   - Separate staging environment in `wrangler.toml`:
     ```toml
     [env.staging]
     name = "chroniclesync-worker-staging"
     routes = [{ pattern = "api-staging.chroniclesync.xyz" }]
     ```

3. **Local vs CI Environment**
   - Local development: Use `npm run dev` for Wrangler interactive mode
   - CI environment: Uses pre-deployed staging instances
   - E2E tests automatically use staging URLs in CI

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development setup
- Commit guidelines
- Pull request process
- Testing requirements
