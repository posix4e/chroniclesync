# ChronicleSync Safari Extension Integration Guide

This guide explains how to integrate the Safari extension with the existing ChronicleSync system.

## Overview

The Safari extension provides history synchronization functionality for iOS devices. It allows users to sync their browsing history from Safari to the ChronicleSync system.

## Integration Steps

### 1. Add the iOS Project to Your Workspace

1. Add the iOS project to your existing workspace:
   ```bash
   # From the root of the repository
   cd ios/ChronicleSync
   xed .
   ```

2. Configure the project settings:
   - Set the bundle identifier
   - Configure signing certificates
   - Set deployment targets

### 2. Connect to the ChronicleSync Backend

The Safari extension needs to communicate with the ChronicleSync backend to sync history data. Update the API endpoint in the extension:

1. Create a configuration file:
   ```swift
   // Config.swift
   struct Config {
       static let apiEndpoint = "https://your-api-endpoint.com/sync"
       static let clientId = "your-client-id"
   }
   ```

2. Use this configuration in the SafariWebExtensionHandler to send data to the backend.

### 3. Implement the JavaScript Interface

Create a JavaScript interface for the Safari extension to communicate with the native code:

1. Create a JavaScript file in the extension:
   ```javascript
   // safari-extension.js
   browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
     if (message.type === 'syncHistory') {
       browser.runtime.sendNativeMessage({ command: 'syncHistory' }, response => {
         sendResponse(response);
       });
       return true; // Will respond asynchronously
     }
   });
   ```

2. Add this file to your extension's manifest.json:
   ```json
   {
     "background": {
       "scripts": ["safari-extension.js"]
     }
   }
   ```

### 4. Update the Extension's Background Script

Modify the existing background script to handle Safari-specific functionality:

1. Detect the browser environment:
   ```javascript
   const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
   ```

2. Use browser-specific APIs:
   ```javascript
   if (isSafari) {
     // Use Safari-specific code
     browser.runtime.sendNativeMessage({ command: 'syncHistory' }, handleResponse);
   } else {
     // Use Chrome-specific code
     chrome.history.search({ ... }, handleResponse);
   }
   ```

### 5. Test the Integration

1. Build and run the iOS app
2. Enable the Safari extension in Settings
3. Test the history sync functionality
4. Verify that the data is correctly synced to the ChronicleSync backend

## Troubleshooting

### Common Issues

1. **Permission Errors**: Make sure the extension has the necessary permissions in the Info.plist file.

2. **Communication Errors**: Check that the message format between JavaScript and native code is consistent.

3. **API Endpoint Issues**: Verify that the API endpoint is correct and accessible.

### Debugging

1. Enable debug logging in the Safari extension:
   ```swift
   logger.debug("Debug message")
   ```

2. View logs in the Console app on macOS:
   - Filter for "ChronicleSync" in the Console app
   - Look for messages from the "SafariExtensionHandler" category

## Next Steps

After integrating the Safari extension, consider these next steps:

1. **User Interface**: Create a native iOS UI for managing history sync settings.

2. **Authentication**: Implement user authentication for secure syncing.

3. **Advanced Features**: Add support for syncing bookmarks, tabs, and other browser data.

4. **Analytics**: Implement analytics to track usage and identify issues.

## Resources

- [Safari App Extensions Documentation](https://developer.apple.com/documentation/safariservices/safari_app_extensions)
- [Safari Web Extensions Documentation](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
- [WKWebsiteDataStore Documentation](https://developer.apple.com/documentation/webkit/wkwebsitedatastore)