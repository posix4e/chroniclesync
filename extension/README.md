# ChronicleSync Browser Extension

A cross-platform browser extension for ChronicleSync that works on Chrome, Firefox, and Safari (including iOS).

## Development Setup

```bash
npm install
```

## Building the Extension

### For All Platforms

To build the extension for all supported platforms:

```bash
npm run build:all
```

This will create:
- `chrome-extension.zip`: Chrome extension package
- `firefox-extension.zip`: Firefox extension package
- `safari-extension.zip`: Safari extension package
- `safari-ios/`: Safari iOS extension project files

### For Specific Platforms

```bash
# Chrome
npm run build:chrome

# Firefox
npm run build:firefox

# Safari
npm run build:safari
```

### Legacy Build

The original Chrome-only build:

```bash
# Development build (outputs to `dist/`)
npm run build

# Production package (creates `chrome-extension.zip`)
npm run build:extension
```

The production package contains only the necessary files for the extension to run:
- manifest.json
- popup.html and popup.css
- settings.css
- Built JavaScript files
- Required assets

## Testing

### Prepare Testing Environment

```bash
# Install all browsers
npx playwright install --with-deps

# Or install specific browsers
npx playwright install --with-deps chromium
npx playwright install --with-deps firefox
npx playwright install --with-deps webkit
```

### Cross-Platform Testing

```bash
# Test on all platforms
npm run test:e2e:all

# Test on specific platforms
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:safari  # macOS only
```

### Basic Testing

```bash
npm run lint
npm run test
```

### Extended Testing

```bash
export API_URL="https://api-staging.chroniclesync.xyz"
export DEBUG="pw:api"
export PWDEBUG="1"
# or no xvfb
xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" npx playwright test
```

## Safari iOS Development

For Safari iOS development, you'll need macOS with Xcode installed:

```bash
# Set up Safari iOS development environment
./scripts/setup-safari-ios.sh
```

See [CROSS_PLATFORM.md](./CROSS_PLATFORM.md) for detailed instructions on Safari iOS development.

## Documentation

- [DEVELOPER.md](./DEVELOPER.md): General development guidelines
- [CROSS_PLATFORM.md](./CROSS_PLATFORM.md): Comprehensive guide for cross-platform development
