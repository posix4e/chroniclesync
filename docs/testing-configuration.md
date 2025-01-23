# Testing Configuration Guide

## Overview

This project uses two separate Playwright configuration files for different testing purposes:
1. `playwright.config.ts` - For Chrome extension testing
2. `extension.ts` - For regular page testing

## Why Two Configurations?

### Extension Testing (`playwright.config.ts`)
The extension configuration is specifically designed for testing Chrome extension functionality:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    headless: false,
    baseURL: 'chrome-extension://[extension-id]/',
  },
  projects: [{
    name: 'chromium',
    use: {
      launchOptions: {
        args: [
          `--disable-extensions-except=${paths.extension}`,
          `--load-extension=${paths.extension}`,
        ],
      },
    },
  }],
  globalSetup: './e2e/global-setup.ts',
});
```

This configuration:
- Sets up Chrome with extension loading capabilities
- Uses chrome-extension:// protocol for testing
- Configures specific extension testing requirements

### Page Testing (separate configuration)
Regular page testing requires different settings:
- Standard HTTP/HTTPS protocols
- No extension-specific browser arguments
- Different base URLs and testing contexts

## Benefits of Separation

1. **Clean Separation of Concerns**
   - Each configuration serves a specific testing purpose
   - Changes to one type of testing don't affect the other

2. **Independent Test Execution**
   - Run extension tests separately from page tests
   - Different CI/CD pipelines can use different configs

3. **Maintenance Benefits**
   - Easier to maintain and update configurations
   - Clearer organization of test requirements
   - Reduced risk of configuration conflicts

4. **Environment-Specific Settings**
   - Extension tests can use extension-specific browser settings
   - Page tests can use standard browser configurations

## Usage

### Running Extension Tests
```bash
npx playwright test --config=playwright.config.ts
```

### Running Page Tests
```bash
npx playwright test --config=extension.ts
```

## Best Practices

1. Keep configurations focused on their specific testing needs
2. Document any special requirements or setup procedures
3. Use environment variables for dynamic values
4. Maintain separate test directories for different test types