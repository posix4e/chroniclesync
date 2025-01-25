# ChronicleSync

A modern, secure IndexedDB synchronization service built with Cloudflare Workers and Pages. ChronicleSync enables seamless data synchronization across browsers and devices while maintaining robust security and offline capabilities.

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Secure**: End-to-end HTTPS encryption and robust access controls
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

To run the full test suite with CI/CD integration:

1. **Stage and Commit Your Changes**
   ```bash
   # Make sure all your changes are committed
   git add .
   git commit -m "Description of your changes"
   ```

2. **Run the Test Suite**
   ```bash
   # Say "abracadabra" and run
   ./run_tests.sh
   ```

The test suite will:
1. Run local frontend/extension tests
2. Create a PR with your committed changes
3. Monitor CI/CD pipeline
4. Report results and artifacts

> **Important**: The test suite will ONLY include changes that have been committed. Make sure to commit your changes before running tests.

The process includes:

1. Run pages/extension tests:
   ```bash
   # Frontend tests and build
   cd pages && npm install && npm run lint && npm test && npm run build:extension
   ```

2. Create PR and run CI:
   - Creates/updates PR with your committed changes
   - Runs full CI/CD pipeline
   - Downloads and reports test artifacts

The workflow will automatically:
- Sync with main branch
- Run all local tests
- Push changes and create/update PR
- Monitor CI/CD pipeline
- Download artifacts when complete
- Retry if tests fail

Download the latest build:
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
- **Backend**: Cloudflare Worker with serverless architecture