# ChronicleSync Local Development Guide

## Prerequisites

- Node.js and npm installed
- For Safari extension development:
  - macOS system
  - Xcode 15.0 or later
  - Safari Web Extension converter tool

## Local Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start the React development server:
```bash
npm run dev
```
This will start the development server at http://localhost:3000

## Browser Extension Development

ChronicleSync supports multiple browser platforms through platform-specific manifest files:

* Chrome/Edge: Uses Manifest V3 (`manifest.v3.json`)
* Firefox/Safari: Uses Manifest V2 (`manifest.v2.json`)

### Local Build Process

Build the extension for your target browser:

```bash
# Build for Chrome (uses manifest.v3.json)
npm run build:chrome

# Build for Firefox (uses manifest.v2.json)
npm run build:firefox

# Build for Safari (uses manifest.v2.json)
npm run build:safari
```

### Testing the Extension Locally

1. Chrome/Edge:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/chrome` directory

2. Firefox:
   - Go to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select any file in the `dist/firefox` directory

3. Safari:
   - Open Xcode
   - Build the Safari extension project
   - Enable the extension in Safari preferences

### Manifest Validation

Before testing, validate your manifest changes:

```bash
npm run validate:manifests
```

This checks:
* Required fields are present
* Correct manifest version for each platform
* Required permissions are included
* Icons are present and valid
* Platform-specific requirements are met

## Development Tips

### Adding New Permissions

* For Chrome/Edge (V3):
  - Add to `host_permissions` in manifest.v3.json
* For Firefox/Safari (V2):
  - Add to `permissions` in manifest.v2.json

### Modifying Background Scripts

* Chrome/Edge (V3):
  - Update `service_worker` in manifest.v3.json
* Firefox/Safari (V2):
  - Update `scripts` array in manifest.v2.json

### Browser Actions

* Chrome/Edge (V3):
  - Use `action` in manifest.v3.json
* Firefox/Safari (V2):
  - Use `browser_action` in manifest.v2.json

### Cross-browser Testing

Test your changes on all supported browsers:
* Chrome: Verify Manifest V3 compatibility
* Firefox: Verify Manifest V2 compatibility
* Safari: Verify macOS/Safari-specific requirements