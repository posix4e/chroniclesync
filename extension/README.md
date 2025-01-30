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
npx playwright install --with-deps chromium

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
npx playwright test
```
