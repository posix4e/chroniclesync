# ChronicleSync

A modern, secure IndexedDB synchronization service built with Cloudflare Workers and Pages. ChronicleSync enables seamless data synchronization across browsers and devices while maintaining robust security and offline capabilities.

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Secure**: End-to-end HTTPS encryption and robust access controls
- **Password Manager Integration**: Works seamlessly with 1Password and other password managers
- **Chrome Extension**: Easy-to-use browser integration with dedicated window interface
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Development

### Prerequisites
- GitHub account with repository access
- Cloudflare account for deployments
- Node.js 18 or later
- npm package manager

### Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/chroniclesync.git
   cd chroniclesync
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   cd pages
   npm install

   # Install backend dependencies
   cd ../worker
   npm install
   ```

3. **Start Development Servers**
   ```bash
   # Start frontend development server
   cd pages
   npm run dev

   # Start worker development server (in another terminal)
   cd worker
   npm run dev
   ```

4. **Run Tests Locally**
   ```bash
   # Run frontend tests
   cd pages
   npm run test

   # Run worker tests
   cd worker
   npm run test
   ```

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── worker/         # Cloudflare Worker backend
└── extension/      # Chrome extension build output
```

### Continuous Integration

Our CI/CD pipeline automatically handles testing, building, and deployment:

1. **On Pull Request**
   - Runs linting and unit tests
   - Builds frontend and extension
   - Creates preview deployments
   - Runs E2E tests with Playwright
   - Provides test reports and artifacts

2. **On Main Branch**
   - Performs all PR checks
   - Deploys to production
   - Includes automatic rollback if tests fail

### Testing

#### Unit Tests
- Run `npm test` in either `pages/` or `worker/` directory
- Tests are written using Jest

#### E2E Tests

> **IMPORTANT**: All extension tests MUST be run in headed mode (not headless) to properly test Chrome extension functionality.

We provide a Python script to run E2E tests through GitHub Actions, which is the recommended approach:

```bash
# Set up GitHub token
export GITHUB_TOKEN=your_token_here

# Run tests and wait for results
./scripts/run_tests.py --wait

# Run tests with specific browser and debug mode
./scripts/run_tests.py --browser firefox --debug --wait

# Run tests against custom API endpoint
./scripts/run_tests.py --api-endpoint https://api-staging.chroniclesync.xyz --wait

# Run tests and download artifacts
./scripts/run_tests.py --wait --download-artifacts
```

Available options:
- `--browser`: Browser to test in (chromium/firefox/webkit)
- `--api-endpoint`: Custom API endpoint to test against
- `--debug`: Enable debug mode for troubleshooting
- `--wait`: Wait for test completion and show results
- `--download-artifacts`: Download test artifacts after completion

Test artifacts are available for 30 days in the Actions tab and can be downloaded using the script.

### Extension Development

1. **Build the Extension**
   ```bash
   cd pages
   npm run build:extension
   ```

2. **Load in Chrome**
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` directory

Alternatively, download the latest build:
1. Go to Actions → CI/CD
2. Download `chrome-extension.zip`
3. Unzip and load in Chrome as above

### Deployment

- Frontend deploys to: `https://$BRANCH.chroniclesync.pages.dev`
- API deploys to:
  - Staging: `https://api-staging.chroniclesync.xyz`
  - Production: `https://api.chroniclesync.xyz`

> **Note**: Production deployments require approval and passing tests

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Chrome Extension**: Custom window interface with password manager integration
- **Backend**: Cloudflare Worker with serverless architecture