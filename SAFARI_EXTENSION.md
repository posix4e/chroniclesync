# ChronicleSync Safari Extension for iOS

This document describes how the ChronicleSync Safari Extension for iOS works and how it's built.

## Overview

The ChronicleSync Safari Extension for iOS is built using the Safari App Extension architecture, which allows the extension to run within Safari on iOS devices. The extension consists of two main components:

1. **iOS App**: The container app that users install from the App Store. This app provides:
   - Instructions for enabling the Safari extension
   - Access to settings
   - Access to browsing history

2. **Safari Extension**: The extension that runs within Safari and provides the core functionality:
   - Tracking browsing history
   - Syncing data with the ChronicleSync service

## Architecture

### iOS App Structure

The iOS app is structured as follows:

- **MainViewController**: The main screen that users see when they open the app. It provides:
  - Instructions for enabling the extension
  - Buttons to access settings and history
  - A button to open Safari extension settings

- **SettingsViewController**: Displays the settings page in a WebView, using the same settings.html from the Chrome extension.

- **HistoryViewController**: Displays the history page in a WebView, using the same history.html from the Chrome extension.

### Safari Extension Structure

The Safari extension is implemented as a Safari App Extension that loads the web extension resources from the Chrome extension:

- **SafariWebExtensionHandler**: Handles communication between the native app and the web extension.
- **Resources**: Contains the web extension files (HTML, CSS, JS) from the Chrome extension.

## Building the Extension

The extension is built using GitHub Actions on a macOS runner. The build process:

1. Builds the Chrome extension
2. Creates an Xcode project for the Safari extension
3. Copies the Chrome extension resources to the Safari extension
4. Builds the iOS app and Safari extension
5. Creates an unsigned IPA file
6. Tests the app in the iOS simulator
7. Uploads the IPA file and screenshots as artifacts

## Testing the Extension

The extension is tested in the iOS simulator to ensure it works correctly. The testing process:

1. Installs the app in the simulator
2. Takes a screenshot of the home screen
3. Launches the app
4. Takes a screenshot of the app

## Differences from Chrome Extension

The Safari extension has some differences from the Chrome extension:

1. **Container App**: Safari extensions on iOS require a container app, which provides access to settings and history.

2. **Extension Activation**: Users must manually enable the extension in Safari settings.

3. **Permissions**: Safari extensions have different permission models than Chrome extensions.

4. **Background Processing**: Safari extensions have more limited background processing capabilities.

## Using the Extension

To use the ChronicleSync Safari extension:

1. Install the ChronicleSync app on your iOS device
2. Open the app and follow the instructions to enable the Safari extension
3. Open Safari and use the extension by tapping the extension button in the toolbar

## Troubleshooting

If the extension doesn't work:

1. Make sure the extension is enabled in Safari settings
2. Check that you've granted the necessary permissions
3. Restart Safari and try again
4. If problems persist, check the app's settings page for more information