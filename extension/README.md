# History sync extension

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

2. Production packages:
```bash
# For Chrome (creates chrome-extension.zip)
npm run build:extension

# For Safari iOS (creates Xcode project in safari-ios/ directory)
npm run build:safari-ios

# For Safari iOS IPA file (requires macOS)
npm run build:safari-ios-ipa
```

The production packages contain only the necessary files for the extension to run:
- manifest.json
- popup.html and popup.css
- settings.css
- Built JavaScript files
- Required assets

For Safari iOS, an Xcode project is created that can be used to build and test the extension on iOS devices and simulators.

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
