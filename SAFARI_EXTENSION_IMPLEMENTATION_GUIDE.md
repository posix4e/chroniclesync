# ChronicleSync Safari Extension Implementation Guide

This guide provides detailed instructions for implementing the ChronicleSync Safari extension based on the existing Chrome extension.

## Prerequisites

- Xcode 13 or later
- Apple Developer account
- macOS 11 or later
- Basic knowledge of Swift and iOS development

## Setup Process

1. **Run the setup script**

   ```bash
   cd chroniclesync
   ./create_safari_extension.sh
   ```

   This script will:
   - Create the basic structure for a Safari extension project
   - Set up the necessary Swift files for the iOS app
   - Create configuration files for the Xcode project

2. **Update your Team ID**

   Before running the script, make sure to update the `TEAM_ID` variable in the script with your Apple Developer Team ID.

3. **Copy Extension Resources**

   ```bash
   ./copy_extension_resources.sh
   ```

   This will copy the necessary files from the Chrome extension to the Safari extension.

4. **Generate Xcode Project**

   ```bash
   brew install xcodegen  # If not already installed
   ./generate_xcode_project.sh
   ```

   This will generate the Xcode project and open it.

## Implementation Details

### 1. Main App Structure

The iOS app consists of:

- **Main View Controller**: Provides information about the extension and buttons to access settings
- **Settings View Controller**: Allows users to configure the extension with the same options as the Chrome extension

### 2. Safari Extension Structure

The Safari extension includes:

- **SafariWebExtensionHandler.swift**: Handles communication between the extension and the app
- **Resources directory**: Contains the web extension files (HTML, CSS, JS)

### 3. Adapting Chrome Extension Code

When adapting the Chrome extension code for Safari, consider the following:

#### Manifest Differences

Safari extensions use the same manifest.json format as Chrome extensions, but with some differences:

```javascript
// Changes needed for Safari compatibility
{
  "manifest_version": 3,
  // ...
  "browser_specific_settings": {
    "safari": {
      "strict_min_version": "15.0"
    }
  }
}
```

#### API Differences

Some Chrome APIs need to be adapted for Safari:

- Replace `chrome.storage` with `browser.storage`
- Replace `chrome.tabs` with `browser.tabs`
- Replace `chrome.runtime` with `browser.runtime`

Example:
```javascript
// Chrome version
chrome.storage.local.get(['key'], function(result) {
  console.log(result.key);
});

// Safari version
browser.storage.local.get(['key']).then(result => {
  console.log(result.key);
});
```

#### Content Scripts

Content scripts work similarly in Safari, but you may need to adjust permissions:

```javascript
// In manifest.json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["content-script.js"],
    "run_at": "document_idle"
  }
]
```

### 4. Shared Settings

To share settings between the app and extension:

```swift
// In Swift code
let userDefaults = UserDefaults(suiteName: "xyz.chroniclesync.safari.shared")
userDefaults?.set("value", forKey: "key")

// In JavaScript
browser.storage.local.set({ key: "value" });
```

### 5. Building and Testing

1. Select your development team in Xcode
2. Build and run the app on a device or simulator
3. Enable the extension in Safari settings
4. Test the extension functionality

### 6. Debugging

To debug the Safari extension:

1. Enable the Develop menu in Safari preferences
2. Use "Develop > Web Extension Background Pages" to access the background page console
3. Use "Develop > Show Web Inspector" to debug content scripts

## Key Files to Modify

1. **manifest.json**
   - Update for Safari compatibility

2. **JavaScript Files**
   - Adapt Chrome API calls to use the browser namespace
   - Update any platform-specific code

3. **SafariWebExtensionHandler.swift**
   - Implement message handling between the app and extension

4. **SettingsViewController.swift**
   - Ensure settings are properly saved and shared with the extension

## Distribution

1. Archive the app in Xcode
2. Submit to the App Store through App Store Connect
3. Provide appropriate screenshots and descriptions

## Troubleshooting

- **Extension not loading**: Check Safari settings and ensure the extension is enabled
- **Settings not syncing**: Verify the shared UserDefaults suite name is consistent
- **JavaScript errors**: Check the Safari Web Inspector console for details
- **Permissions issues**: Ensure the necessary permissions are declared in the manifest

## Resources

- [Safari Web Extensions Documentation](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
- [Safari App Extensions Programming Guide](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/SafariAppExtension_PG/)
- [Browser Extensions API Compatibility](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_compatibility)