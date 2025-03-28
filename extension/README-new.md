# ChronicleSync Extension

A browser extension for synchronizing browsing history across devices.

## Project Structure

```
extension/
├── .config/               # All configuration files
│   ├── .eslintrc.json     # ESLint configuration
│   ├── jest.config.js     # Jest configuration
│   ├── tsconfig.json      # TypeScript configuration
│   ├── tsconfig.node.json # TypeScript Node configuration
│   └── vite.config.ts     # Vite configuration
├── public/                # Static assets
├── scripts/               # Build scripts
├── src/
│   ├── api/               # API communication
│   │   └── client.ts      # API client
│   ├── background/        # Background script modules
│   │   ├── history-sync.ts    # History synchronization
│   │   ├── initialization.ts  # Extension initialization
│   │   └── message-handler.ts # Message handling
│   ├── components/        # Shared React components
│   ├── content/           # Content scripts
│   ├── db/                # Database services
│   │   ├── DatabaseService.ts  # Generic database service
│   │   ├── DeviceRepository.ts # Device repository
│   │   ├── HistoryRepository.ts # History repository
│   │   └── HistoryStore.ts     # Facade for backward compatibility
│   ├── pages/             # Page-specific components
│   ├── styles/            # CSS files
│   │   └── main.css       # Main stylesheet
│   ├── utils/             # Utility functions
│   ├── background.ts      # Main background script entry point
│   └── types.ts           # TypeScript type definitions
└── tests/                 # All tests
    ├── mocks/             # Test mocks
    ├── extension-setup.js # Extension-specific test setup
    └── setup.js           # Common test setup
```

## Development Setup

```bash
npm install
```

## Building the Extension

There are two ways to build the extension:

1. Development build (outputs to `dist/`):
```bash
npm run build
```

2. Production package (creates `chrome-extension.zip`):
```bash
npm run build:extension
```

The production package contains only the necessary files for the extension to run:
- manifest.json
- popup.html and popup.css
- settings.css
- Built JavaScript files
- Required assets

## Testing

### Prepare testing environment
```
npx playwright install --with-deps chromium
```

### Basic testing
```bash
npm run lint
npm run test
```

### Extended testing
```bash
export API_URL="https://api-staging.chroniclesync.xyz"
export DEBUG="pw:api"
export PWDEBUG="1"
# or no xvfb
xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" npx playwright test
```

## Architecture

The extension follows a modular architecture:

1. **Background Script**: Split into specialized modules:
   - `history-sync.ts`: Handles history synchronization
   - `message-handler.ts`: Processes extension messages
   - `initialization.ts`: Handles extension setup

2. **Database Layer**: Uses a repository pattern:
   - `DatabaseService.ts`: Generic database operations
   - `HistoryRepository.ts`: History-specific operations
   - `DeviceRepository.ts`: Device-specific operations
   - `HistoryStore.ts`: Facade for backward compatibility

3. **API Communication**: Centralized in the API client:
   - `client.ts`: Handles all server communication

4. **UI Components**: React components for the extension UI

5. **Content Scripts**: Handle page content extraction

## Configuration

All configuration files are centralized in the `.config` directory:

- **TypeScript**: `.config/tsconfig.json`
- **ESLint**: `.config/.eslintrc.json`
- **Jest**: `.config/jest.config.js`
- **Vite**: `.config/vite.config.ts`
