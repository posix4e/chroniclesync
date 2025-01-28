# ChronicleSync Pages

The pages component includes the frontend application and Chrome extension for ChronicleSync.

## Development

### Prerequisites
- Node.js 18 or later
- npm package manager
- Chrome browser for extension development

### Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   npx playwright install --with-deps chromium
   ```

2. **Start Development Server**
   ```bash
   # For the extension
   npm run build:extension
   ```

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension` directory

### Testing

1. **Unit Tests**
   ```bash
   npm test
   ```

2. **End-to-End Tests**
   ```bash
   # Run Pages deployment tests
   npx playwright test --config=playwright.pages.config.ts

   # Run Extension tests
   npx playwright test --config=playwright.extension.config.ts

   # Run all E2E tests
   npx playwright test --config=playwright.extension.config.ts && npx playwright test --config=playwright.pages.config.ts
   ```

   The tests are split into two configurations:
   - `playwright.pages.config.ts`: Tests for the Pages deployment
   - `playwright.extension.config.ts`: Tests for the Chrome extension

   You can also use the npm scripts:
   ```bash
   npm run test:e2e:pages     # Run Pages tests
   npm run test:e2e:extension # Run Extension tests
   npm run test:e2e          # Run all tests
   ```

### Project Structure

```
pages/
├── src/               # Source code
│   ├── components/    # React components
│   ├── utils/         # Utility functions
│   └── background.ts  # Extension background script
├── e2e/              # End-to-end tests
└── public/           # Static assets
```

## Extension Features

- Browser history synchronization
- Configurable retention period
- Real-time sync status
- Offline support

## Web Interface

The web interface provides:
- History search and viewing
- Admin dashboard
- Health monitoring
- Configuration management

## Building for Production

```bash
# Build web interface
npm run build

# Build extension
npm run build:extension
```

## Deployment

The web interface is automatically deployed to:
- Development: `https://$BRANCH.chroniclesync.pages.dev`
- Production: `https://chroniclesync.pages.dev`

Deployments are handled by the CI/CD pipeline when changes are merged to the main branch.
