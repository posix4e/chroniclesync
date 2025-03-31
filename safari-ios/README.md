# ChronicleSync Safari iOS Extension

This directory contains the Safari iOS extension version of the ChronicleSync Chrome extension.

## Project Structure

- `ChronicleSync/` - Xcode project directory
  - `ChronicleSync/` - Container app
  - `ChronicleSync Extension/` - Safari extension
    - `Resources/` - Extension web resources (copied from Chrome extension)
    - `SafariWebExtensionHandler.swift` - Native Safari extension handler

## Building the Extension

1. Run the build script to copy Chrome extension files to Safari extension:

```bash
./build-safari-extension.sh
```

2. Open the Xcode project:

```bash
open ChronicleSync/ChronicleSync.xcodeproj
```

3. Build and run the project in Xcode

## Platform Adapter

The platform adapter in `extension/src/platform/index.ts` provides a compatibility layer between Chrome and Safari extension APIs. It handles:

- Browser detection (Safari vs Chrome)
- Storage API compatibility
- Runtime messaging compatibility
- Basic history API compatibility

## Limitations

This is a minimal implementation focusing on core functionality:
- Only essential APIs are supported (storage, runtime)
- Complex features like history/tabs handling may require additional adaptation
- UI is minimal for the container app

## Development

To modify the extension:

1. Make changes to the Chrome extension
2. Run the build script to update the Safari extension
3. Test in Xcode simulator or on a device