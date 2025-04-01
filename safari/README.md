# ChronicleSync Safari Extension

This directory contains the Safari extension for ChronicleSync.

## Project Structure

```
safari/
├── ChronicleSync/  # iOS app container
│   ├── AppDelegate.swift
│   ├── ViewController.swift
│   └── Info.plist
├── Extension/      # Safari extension
│   ├── SafariWebExtensionHandler.swift
│   ├── Info.plist
│   └── Resources/  # Web extension resources (HTML, CSS, manifest)
└── project.yml     # Xcode project configuration
```

## Development Setup

1. Run the setup scripts to create the Safari extension structure:
   ```bash
   ./scripts/create_safari_project.sh
   ```

2. Generate the extension resources:
   ```bash
   ./scripts/copy_extension_resources.sh
   ```

3. Open the project in Xcode:
   ```bash
   cd safari
   xcodegen generate
   open ChronicleSync.xcodeproj
   ```

4. Build and run the project in Xcode.

## Generated Files

Note that JavaScript files in the `safari/Extension/Resources/` directory are generated during the build process and should not be committed to version control. The `.gitignore` file is configured to exclude these files.

When you run `./scripts/copy_extension_resources.sh`, it will:

1. Build the web extension from the source files
2. Copy and adapt the necessary files to the Safari extension
3. Generate the browser-polyfill.js file for compatibility

## Testing

To test the Safari extension:

1. Build the project in Xcode
2. Run the app in the iOS Simulator
3. Open Safari in the simulator
4. Enable the extension in Safari settings
5. Verify the extension loads and functions correctly