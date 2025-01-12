# ChronicleSync Development Guide

## Browser Extension Development

ChronicleSync supports multiple browser platforms through platform-specific manifest files:

* Chrome/Edge: Uses Manifest V3 (`manifest.v3.json`)
* Firefox/Safari: Uses Manifest V2 (`manifest.v2.json`)

### Manifest Handling

Each browser platform has different requirements for extension manifests:

#### Chrome/Edge (manifest.v3.json)

* Uses Manifest V3 format
* Supports `host_permissions` separate from `permissions`
* Uses `action` for browser action
* Uses `service_worker` for background scripts

#### Firefox (manifest.v2.json)

* Uses Manifest V2 format
* All permissions (including host permissions) must be in the `permissions` array
* Uses `browser_action` instead of `action`
* Uses `scripts` array in background section

#### Safari (manifest.v2.json)

* Uses Manifest V2 format
* Same requirements as Firefox
* Requires absolute paths for Safari extension converter
* Must be built on macOS with Xcode installed

### Build Process

The build process automatically selects the correct manifest version for each platform:

```bash
# Build for Chrome (uses manifest.v3.json)
npm run build:chrome

# Build for Firefox (uses manifest.v2.json)
npm run build:firefox

# Build for Safari (uses manifest.v2.json)
npm run build:safari
```

### Safari Extension Requirements

To build the Safari extension:

* Must be built on macOS
* Requires Xcode 15.0 or later
* Requires Safari Web Extension converter tool
* Must use Manifest V2 format

Common issues:

* Safari extension converter requires absolute paths
* All host permissions must be in the `permissions` array
* Must use `browser_action` instead of `action`
* Background scripts must be specified in `scripts` array

### Validation

The build process includes manifest validation to ensure compatibility:

```bash
npm run validate:manifests
```

This checks:

* Required fields are present
* Correct manifest version for each platform
* Required permissions are included
* Icons are present and valid
* Platform-specific requirements are met

### Development Tips

#### Adding New Permissions

* Add to `host_permissions` in manifest.v3.json
* Add to `permissions` in manifest.v2.json

#### Modifying Background Scripts

* Update `service_worker` in manifest.v3.json
* Update `scripts` array in manifest.v2.json

#### Adding Browser Actions

* Use `action` in manifest.v3.json
* Use `browser_action` in manifest.v2.json

#### Testing

* Test on Chrome to verify Manifest V3 compatibility
* Test on Firefox to verify Manifest V2 compatibility
* Test on Safari to verify macOS/Safari-specific requirements