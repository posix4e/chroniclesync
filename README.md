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

### Getting Started

1. **Fork & Clone**: Fork this repository and clone your fork
2. **Create a Branch**: Create a new branch for your changes
3. **Make Changes**: Modify code in your branch
4. **Open PR**: Create a pull request to the main branch

Our [GitHub Actions workflow](.github/workflows/ci-cd.yml) will automatically:
- Install all dependencies
- Run linting and unit tests
- Build the extension and web app
- Deploy preview environments
- Run E2E tests

> **Note**: Avoid running Playwright tests locally as they can leave behind zombie processes and are environment-sensitive. Instead, use the [Manual Playwright Testing](#manual-playwright-testing) workflow in GitHub Actions.

### Development Workflow

#### Automated CI/CD

Each pull request triggers our CI/CD pipeline which:

1. **Build & Test** ([view action](../../actions/workflows/ci-cd.yml))
   - Installs dependencies
   - Runs linting
   - Executes unit tests
   - Builds extension and web app
   - Triggers Playwright E2E tests ([separate workflow](../../actions/workflows/playwright-tests.yml))

2. **Preview Deployment**
   - Creates preview environment
   - Deploys frontend to: `https://$BRANCH.chroniclesync.pages.dev`
   - Deploys API to: `https://api-staging.chroniclesync.xyz`

3. **Extension Testing**
   - Builds Chrome extension
   - Uploads extension artifact
   - Provides test report with screenshots

The CI/CD pipeline automatically triggers the Playwright tests workflow with default settings (Chromium browser, no debug mode). Test results are available in the [Actions tab](../../actions) under the "Playwright Tests" workflow.

#### Manual Playwright Testing

For development and debugging, you can run Playwright tests on-demand using our dedicated workflow:

1. Go to the [Actions tab](../../actions/workflows/playwright-tests.yml)
2. Click "Run workflow" and configure:
   - **Browser**: Choose between Chromium, Firefox, or WebKit
   - **Debug Mode**: Enable for additional logging and debugging info

The workflow will:
- Run tests in a clean environment
- Install only the selected browser
- Build the extension
- Run all Playwright tests
- Upload test results and screenshots as artifacts

This is particularly useful when:
- Testing browser-specific behavior
- Debugging test failures
- Verifying extension functionality
- Running tests without setting up a local environment

Test artifacts (reports and screenshots) are available for 30 days after each run.

### Loading the Extension

After each successful build, download the extension artifact from the [Actions tab](../../actions):
1. Find your PR's workflow run
2. Download the `chrome-extension.zip` artifact
3. Unzip and load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the unzipped directory

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Chrome Extension**: Custom window interface with password manager integration
- **Backend**: Cloudflare Worker with serverless architecture
