# ChronicleSync Safari Extension Setup Guide

This guide will help you set up and run the ChronicleSync Safari extension on your local macOS machine using the `add-safari-extension` branch.

## Prerequisites

- macOS with Xcode 13 or later installed
- Apple Developer account (for signing the extension)
- Node.js and npm installed

## Step 1: Clone and Prepare the Repository

If you haven't already, clone the repository and checkout the `add-safari-extension` branch:

```bash
git clone https://github.com/posix4e/chroniclesync.git
cd chroniclesync
git checkout add-safari-extension
```

## Step 2: Build the Extension Files

Navigate to the extension directory and install dependencies:

```bash
cd extension
npm install
npm run build
```

This will compile the TypeScript files and build the extension using Vite.

## Step 3: Open the Xcode Project

Open the Safari extension Xcode project:

```bash
open safari/ChronicleSync/ChronicleSync.xcodeproj
```

## Step 4: Configure Signing in Xcode

1. In Xcode, select the "ChronicleSync" project in the Project Navigator (left sidebar)
2. Select the "ChronicleSync" target
3. Go to the "Signing & Capabilities" tab
4. Select your Apple Developer Team from the dropdown
5. Repeat this process for the "ChronicleSync Extension" target

If you encounter any signing issues:
- Ensure your Apple Developer account is active
- Try using "Automatically manage signing" option
- Check that the Bundle Identifier is unique (you may need to modify it)

## Step 5: Build and Run the Extension

1. Select the "ChronicleSync" scheme from the scheme selector in the toolbar
2. Select your Mac as the run destination
3. Click the Run button (▶️) or press Cmd+R

This will build and launch the ChronicleSync app on your Mac.

## Step 6: Enable the Extension in Safari

1. After the app launches, click the "Enable Extension" button in the app
2. This will open Safari's Extension preferences
3. Check the box next to "ChronicleSync" to enable the extension
4. The extension should now be active in Safari

## Troubleshooting

### If the extension doesn't appear in Safari:

1. Open Safari
2. Go to Safari > Settings > Extensions
3. Verify that ChronicleSync is listed and enabled

### If you encounter build errors:

1. Check Xcode's Issue Navigator (Cmd+5) for specific error details
2. Ensure all extension files were properly built in Step 2
3. Try cleaning the build folder (Shift+Cmd+K) and rebuilding

### If you encounter signing issues:

1. Verify your Apple Developer account is active
2. Try using a different Bundle Identifier
3. Check that you have the necessary provisioning profiles

## Differences from Main Branch

The `add-safari-extension` branch adds the following components:

1. Safari extension Xcode project structure
2. Safari-specific extension implementation files
3. Build script for Safari extension (`scripts/build-safari-extension.sh`)
4. Additional npm script (`build:safari`) in package.json

## Development Workflow

For ongoing development:

1. Make changes to the extension source files
2. Run `npm run build` to rebuild the extension files
3. In Xcode, build and run the app again to test your changes

## Notes

- The Safari extension uses the same core functionality as the Chrome/Firefox extensions
- Safari Web Extensions have some limitations compared to Chrome extensions
- You'll need to rebuild and reinstall the app when making changes to the extension