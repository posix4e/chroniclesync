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

3. **Backend (Cloudflare Worker)**
   - Serverless architecture
   - Efficient data synchronization
   - Metadata management
   - Security middleware

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

ChronicleSync includes comprehensive testing across all components. For detailed information about our testing configuration setup, please see [Testing Configuration Guide](docs/testing-configuration.md).

### Prerequisites
For E2E tests, you need:

1. Playwright browsers:
```bash
npx playwright install chromium
```

2. X Virtual Frame Buffer (Xvfb) for running tests in environments without a display server:
```bash
# On Debian/Ubuntu
sudo apt-get install -y xvfb

# On CentOS/RHEL
sudo yum install -y xorg-x11-server-Xvfb

# On macOS (not needed as it has a display server)
# No installation required

# On Windows (WSL)
sudo apt-get install -y xvfb
```

To run tests with Xvfb:
```bash
# Run a single test
xvfb-run npm run test:e2e

# Run tests in watch mode
xvfb-run npm run test:e2e -- --watch
```

Note: Xvfb is required because the Chrome extension opens in a new window and needs to interact with password managers, which requires a display server. Running in headless mode would limit our ability to test these interactions.

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
