# ChronicleSync Safari Extension Troubleshooting Guide

This guide addresses common issues you might encounter when setting up and running the ChronicleSync Safari extension.

## Common Build Issues

### 1. Code Signing Issues

**Symptoms:**
- "Code Sign Error" in Xcode
- "No signing certificate" errors
- "Failed to code sign" messages

**Solutions:**
- Ensure you have an active Apple Developer account
- In Xcode, go to Preferences > Accounts and verify your Apple ID is added
- Try using "Automatically manage signing" in the Signing & Capabilities tab
- Create a new App ID in the Apple Developer portal if needed
- Try using a different Bundle Identifier (e.g., add your initials to the existing one)

### 2. Missing Files or Resources

**Symptoms:**
- "File not found" errors during build
- Extension doesn't load properly in Safari
- Missing functionality in the extension

**Solutions:**
- Ensure you've run `npm run build` before opening Xcode
- Check that all files were copied to the Resources directory
- Manually copy any missing files from the `dist` directory to `ChronicleSync Extension/Resources/`
- Clean the build folder in Xcode (Shift+Cmd+K) and rebuild

### 3. Entitlements Issues

**Symptoms:**
- App crashes on launch
- Extension doesn't appear in Safari
- Permission-related errors

**Solutions:**
- Check the entitlements file (`ChronicleSync_Extension.entitlements`)
- Ensure the App Groups and other entitlements match your provisioning profile
- Try removing custom entitlements temporarily for testing

## Safari Extension Specific Issues

### 1. Extension Not Appearing in Safari

**Symptoms:**
- Extension doesn't show up in Safari's Extensions preferences
- Can't enable the extension

**Solutions:**
- Make sure you've launched the app at least once
- Check Safari > Settings > Extensions to see if it's listed
- Try restarting Safari
- Verify the extension's Info.plist has the correct bundle identifier
- Check Console.app for any extension-related errors

### 2. Extension Not Working Properly

**Symptoms:**
- Extension is enabled but doesn't function
- Features work differently than in Chrome/Firefox

**Solutions:**
- Check Safari's Web Inspector for JavaScript errors
- Verify permissions are granted in Safari's Extension preferences
- Remember that Safari Web Extensions have some limitations compared to Chrome
- Check that the manifest.json is properly configured

### 3. Debugging Issues

**Symptoms:**
- Can't debug the extension
- Breakpoints not working
- Console logs not appearing

**Solutions:**
- Enable the Develop menu in Safari (Safari > Settings > Advanced)
- Use Safari's Web Inspector to debug (Develop > [Your Mac] > Extension Background Page)
- Add explicit console.log statements for debugging
- Check the system console (Console.app) for extension-related logs

## macOS Specific Issues

### 1. App Notarization Issues

**Symptoms:**
- "App is damaged and can't be opened" message
- Gatekeeper blocking the app

**Solutions:**
- For development, you can right-click the app and select Open to bypass Gatekeeper
- For distribution, you'll need to notarize the app with Apple
- Use `xcodebuild` with the `-allowProvisioningUpdates` flag

### 2. App Sandbox Issues

**Symptoms:**
- App crashes when accessing certain resources
- Permission-related errors

**Solutions:**
- Check the app's entitlements and ensure they include necessary permissions
- Add appropriate usage description strings in Info.plist
- Test with reduced sandbox restrictions during development

## Comparing with Chrome Extension

If the Safari extension behaves differently than the Chrome version:

1. Check for Safari-specific API limitations
2. Verify that all content scripts are properly loaded
3. Test with the same data in both browsers
4. Look for browser detection code that might be affecting behavior

## Getting Additional Help

If you continue to experience issues:

1. Check the Safari Web Extensions documentation: https://developer.apple.com/documentation/safariservices/safari_web_extensions
2. Look for similar issues in the repository's issue tracker
3. Provide detailed error messages and logs when seeking help
4. Try with a clean Safari profile (create a new macOS user account for testing)