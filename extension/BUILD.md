# ChronicleSync Extension Build Process

This document describes the build process for the ChronicleSync browser extension, which supports Chrome, Firefox, and Safari.

## Overview

The build process uses webpack to compile TypeScript code and npm scripts to package the extension for different browsers. The code is structured to minimize duplication between browser-specific implementations.

## Directory Structure

- `src/` - Source code for the extension
  - `browser-api/` - Browser-specific API implementations
    - `chrome/` - Chrome-specific implementation
    - `firefox/` - Firefox-specific implementation
    - `safari/` - Safari-specific implementation
  - Other source files...

## Build Scripts

The following npm scripts are available for building and packaging the extension:

### Build Scripts

- `npm run build` - Build the extension using vite (for development)
- `npm run build:extension` - Build the extension using webpack (for production)
- `npm run build:chrome` - Build the extension for Chrome
- `npm run build:firefox` - Build the extension for Firefox
- `npm run build:safari` - Build the extension for Safari
- `npm run build:all` - Build the extension for all browsers

### Package Scripts

- `npm run package:chrome` - Package the Chrome extension
- `npm run package:firefox` - Package the Firefox extension
- `npm run package:safari` - Package the Safari extension
- `npm run package:all` - Package the extension for all browsers

## Browser-Specific Implementations

The extension uses a browser API abstraction layer to handle browser-specific differences. The implementation is selected at build time based on the target browser.

### Using the Browser API

Import the browser API from the abstraction layer:

```typescript
import { browserAPI, storage, tabs, history } from '../browser-api';
```

This will automatically use the correct implementation for the target browser.

## Building for Safari

The Safari extension is built using the same source code as the Chrome and Firefox extensions. The build process compiles the TypeScript code and copies the resulting JavaScript files to the Safari extension directory.

### Safari Extension Structure

The Safari extension is an Xcode project located in the `ChronicleSync` directory. The JavaScript files are copied to the `Shared (Extension)/Resources` directory.

### Building the Safari Extension

1. Run `npm run build:safari` to build the Safari extension
2. Open the Xcode project in `ChronicleSync` directory
3. Build the project using Xcode

### Automated Build

The GitHub Actions workflow automatically builds the Safari extension and creates an unsigned IPA file for testing.

## Adding Browser-Specific Code

If you need to add browser-specific code, follow these steps:

1. Add the code to the appropriate browser-specific implementation in `src/browser-api/`
2. Export the functionality from the browser-specific implementation
3. Import the functionality from the abstraction layer in your code

## Troubleshooting

If you encounter issues with the build process, try the following:

1. Clean the build directory: `rm -rf dist package`
2. Reinstall dependencies: `npm ci`
3. Run the build again: `npm run build:all`