# ChronicleSync Safari Extension

This is the native iOS Safari extension for ChronicleSync, built using Swift and the Safari App Extension framework.

## Prerequisites

- macOS with Xcode 15.0 or later
- iOS 16.0 or later
- Safari 16.0 or later
- Apple Developer account

## Project Structure

```
ChronicleSync/
├── ChronicleSync/
│   ├── AppDelegate.swift
│   ├── MainViewController.swift
│   └── Views/
│       ├── ClientSectionView.swift
│       ├── AdminLoginView.swift
│       ├── AdminPanelView.swift
│       └── HealthCheckView.swift
└── SafariExtension/
    ├── SafariExtension.swift
    ├── Info.plist
    └── content.js
```

## Building the Extension

1. Open the project in Xcode:
   ```bash
   open ChronicleSync.xcodeproj
   ```

2. Select your development team in the project settings:
   - Click on the project in the navigator
   - Select the "ChronicleSync" target
   - Under "Signing & Capabilities", select your team

3. Build the project:
   - Select "Product" > "Build" or press ⌘B
   - Make sure both the app and extension targets are built

## Installing the Extension

### Development

1. Enable Developer Mode in Safari:
   - Open Safari Preferences
   - Go to "Advanced"
   - Check "Show Develop menu in menu bar"
   - In the Develop menu, enable "Allow Unsigned Extensions"

2. Run the app from Xcode:
   - Select the "ChronicleSync" scheme
   - Click Run or press ⌘R
   - The app will install both the main app and the extension

3. Enable the extension in Safari:
   - Open Safari Preferences
   - Go to "Extensions"
   - Find "ChronicleSync" and enable it

### Distribution

1. Archive the app:
   - Select "Product" > "Archive"
   - Follow the distribution workflow for the App Store

2. Submit to App Store:
   - Use App Store Connect to submit the app
   - The Safari extension will be distributed with the main app

## Development Notes

### Communication Flow

1. Safari Extension (content.js) <-> Native App:
   ```javascript
   // In content.js
   safari.extension.dispatchMessage('syncHistory', {
       data: { /* ... */ }
   });
   ```

   ```swift
   // In SafariExtension.swift
   override func messageReceived(withName messageName: String, 
                               from page: SFSafariPage, 
                               userInfo: [String : Any]?) {
       switch messageName {
       case "syncHistory":
           handleHistorySync(userInfo: userInfo)
       default:
           break
       }
   }
   ```

2. Native App <-> Backend:
   ```swift
   // In ClientSectionView.swift
   private func syncHistory() {
       // API calls to your backend
   }
   ```

### Testing

1. Test the extension:
   ```bash
   xcodebuild test -scheme "ChronicleSync Safari Extension"
   ```

2. Test the main app:
   ```bash
   xcodebuild test -scheme ChronicleSync
   ```

### Debugging

1. Safari Web Inspector:
   - Enable "Develop" menu in Safari
   - Use Web Inspector to debug content.js

2. Xcode Debugger:
   - Set breakpoints in Swift code
   - Use Console for logging

## Troubleshooting

1. Extension not appearing:
   - Check Safari's Extensions preferences
   - Verify code signing is correct
   - Clear Safari's cache

2. Communication issues:
   - Check Safari's console for errors
   - Verify message names match
   - Check permissions in Info.plist