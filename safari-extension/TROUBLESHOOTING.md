# ChronicleSync Safari Extension Troubleshooting Guide

This guide provides solutions for common issues you might encounter when working with the ChronicleSync Safari extension.

## Blank Screen in the App

If you see a blank screen when running the app in the simulator or on a device:

### Solution 1: Rebuild the Extension Resources

The most common cause of a blank screen is missing extension resources. Run the build script to ensure all necessary files are copied:

```bash
cd safari-extension
./build-safari-extension.sh
```

### Solution 2: Clean the Build Folder

Xcode might be using cached files. Clean the build folder and rebuild:

1. In Xcode, select Product > Clean Build Folder
2. Build and run the app again

### Solution 3: Check Storyboard Connections

The blank screen might be caused by broken outlet connections in the storyboard:

1. Open Main.storyboard in Xcode
2. Right-click on the View Controller
3. Verify that the outlets (enableExtensionButton and statusLabel) are properly connected
4. If they show broken connections (yellow warning icons), reconnect them

### Solution 4: Use the Debug UI

The app now includes a fallback UI that should appear even if the storyboard connections are broken. Look for debug messages in the Xcode console that might indicate what's wrong.

## Extension Resources Not Loading

If the extension resources (HTML, CSS, JS files) are not being loaded:

### Solution 1: Check the Resources Directory

1. In the Settings tab of the app, tap "Check Extension Resources"
2. Verify that the extension resources are found and listed

### Solution 2: Manually Copy the Resources

If the build script is failing to copy the resources, you can manually copy them:

1. Build the extension:
   ```bash
   cd extension
   npm install
   npm run build
   ```

2. Create the Resources directory if it doesn't exist:
   ```bash
   mkdir -p "safari-extension/ChronicleSync Extension/Resources"
   ```

3. Copy the necessary files:
   ```bash
   cp extension/popup.html "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/settings.html "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/history.html "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/devtools.html "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/popup.css "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/settings.css "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/history.css "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/devtools.css "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/dist/popup.js "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/dist/background.js "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/dist/settings.js "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/dist/history.js "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/dist/devtools.js "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/dist/devtools-page.js "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/dist/content-script.js "safari-extension/ChronicleSync Extension/Resources/"
   cp extension/bip39-wordlist.js "safari-extension/ChronicleSync Extension/Resources/"
   ```

## Extension Not Working in Safari

If the extension is not working in Safari:

### Solution 1: Enable the Extension in Safari Settings

1. Open Safari
2. Go to Settings > Extensions
3. Make sure ChronicleSync is enabled

### Solution 2: Check Permissions

1. Go to Settings > Safari > Extensions > ChronicleSync
2. Ensure all necessary permissions are granted

### Solution 3: Check Console for Errors

1. Connect your device to your Mac
2. Open Safari on your Mac
3. Enable the Develop menu: Safari > Preferences > Advanced > Show Develop menu in menu bar
4. Select Develop > [Your Device] > [The Website You're On]
5. Check the console for any errors related to the extension

## Build Errors

If you encounter build errors:

### Solution 1: Update Node.js Dependencies

```bash
cd extension
npm install
```

### Solution 2: Check Xcode Version

Make sure you're using Xcode 14.0 or later, as required by the project.

### Solution 3: Check Code Signing

If you're building for a physical device, make sure you have the correct code signing identity and provisioning profile:

1. Select the ChronicleSync project in Xcode
2. Go to the Signing & Capabilities tab
3. Make sure you have a valid team selected
4. If needed, create a new provisioning profile in the Apple Developer portal

## TestFlight Distribution Issues

If you're having trouble with TestFlight distribution:

### Solution 1: Verify Apple Developer Account

Make sure your Apple Developer account is active and has the necessary permissions.

### Solution 2: Check App Store Connect Setup

1. Make sure the app is properly set up in App Store Connect
2. Verify that the bundle ID matches what's in your Xcode project

### Solution 3: Check GitHub Secrets

If using GitHub Actions for TestFlight distribution, make sure all the required secrets are properly set up as described in TESTFLIGHT_SETUP.md.

## Debugging Tips

### Enable Verbose Logging

The app now includes enhanced logging. Check the Xcode console for detailed logs that can help identify issues.

### Use the Debug Settings

In the app, go to the Settings tab and scroll to the Debug section. You can:

1. Check Extension Resources: Verify that extension files are properly loaded
2. Reset UI State: Clear cached UI state and reload
3. View Bundle Info: Show information about the app bundle

### Inspect Safari Web Extension

To debug the Safari web extension JavaScript:

1. Enable Web Inspector in Safari on your iOS device: Settings > Safari > Advanced > Web Inspector
2. Connect your device to your Mac
3. Open Safari on your Mac
4. Enable the Develop menu: Safari > Preferences > Advanced > Show Develop menu in menu bar
5. Select Develop > [Your Device] > [The Website You're On]
6. Use the Web Inspector to debug the extension

## Still Having Issues?

If you're still experiencing problems after trying these solutions:

1. Check the GitHub Issues page for similar problems and solutions
2. Create a new issue with detailed information about the problem, including:
   - Xcode version
   - iOS version
   - Device/simulator model
   - Steps to reproduce
   - Console logs
   - Screenshots if applicable