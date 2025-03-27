# ChronicleSync Browser Extension

A cross-platform browser extension for ChronicleSync that works on Chrome, Firefox, and Safari (including iOS).

## Development Setup

```bash
npm install
```

## Building the Extension

There are multiple ways to build the extension:

1. Development build (outputs to `dist/`):
```bash
npm run build
```

2. Chrome production package (creates `chrome-extension.zip`):
```bash
npm run build:extension
```

3. All platforms (Chrome, Firefox, and Safari):
```bash
npm run build:all
```

4. Safari iOS app (requires Xcode):
```bash
npm run build:safari
```

The production packages contain only the necessary files for the extension to run:
- manifest.json
- HTML and CSS files
- Built JavaScript files
- Required assets

## Cross-Platform Support

The extension is designed to work on multiple browser platforms:

- **Chrome/Firefox**: Standard WebExtension APIs
- **Safari (iOS)**: Safari App Extension with WebExtension compatibility

The cross-platform functionality is achieved through:
- Platform detection utilities (`src/utils/platform.ts`)
- Browser API abstraction layer (`src/utils/browser-api.ts`)

See the [utils README](src/utils/README.md) for more details on the cross-platform implementation.

## Safari Extension

The Safari extension for iOS is located in the `safari/` directory. It includes:

- iOS app container
- Safari extension
- iOS native tests

See the [Safari README](safari/README.md) for more details on building and testing the Safari extension.

## Testing

### Prepare testing environment
```
npx playwright install --with-deps chromium firefox
```

### Basic testing
```bash
npm run lint
npm run test
```

### Browser-specific testing
```bash
# Chrome
npm run test:e2e:chrome

# Firefox
npm run test:e2e:firefox

# iOS (requires Xcode)
npm run test:ios
```

### Extended testing
```bash
export API_URL="https://api-staging.chroniclesync.xyz"
export DEBUG="pw:api"
export PWDEBUG="1"
# or no xvfb
xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" npx playwright test
```
