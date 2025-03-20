# ChronicleSync Build Scripts

This directory contains scripts for building and packaging the ChronicleSync extension for different platforms.

## Scripts

### `build-extension.cjs`

This script builds the Chrome extension and packages it for distribution as a ZIP file for Chrome and an XPI file for Firefox.

Usage:
```bash
npm run build:extension
```

### `build-ios-extension.cjs`

This script builds the Chrome extension and copies the necessary files to the iOS extension directory. It's designed to keep the iOS extension in sync with the Chrome extension codebase.

Usage:
```bash
npm run build:ios
```

## Workflow

The iOS extension build process works as follows:

1. The Chrome extension is built using the standard build process
2. JavaScript files are copied from the Chrome extension to the iOS extension
3. TypeScript files are processed and converted to JavaScript before copying
4. Image files and localization files are copied if they don't already exist in the iOS extension

This approach allows us to maintain a single source of truth for the extension code while supporting multiple platforms.

## GitHub Actions Integration

The GitHub Actions workflow (`build-unsigned-ipa.yml`) uses these scripts to:

1. Build the Chrome extension
2. Update the iOS extension files
3. Build the iOS app for the simulator
4. Create an unsigned IPA file for testing

If changes are detected in the iOS extension files during the build process, they are committed to the repository but not automatically pushed. This allows for review before the changes are merged.

## Development Workflow

When making changes to the extension:

1. Make changes to the Chrome extension code
2. Run `npm run build:ios` to update the iOS extension files
3. Test the iOS extension
4. Commit and push the changes

This ensures that both the Chrome and iOS extensions stay in sync.