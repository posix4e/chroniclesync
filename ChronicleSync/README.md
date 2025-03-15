# ChronicleSync iOS Safari Extension

This is the iOS Safari extension for ChronicleSync, allowing you to sync your browsing history across devices.

## Features

- **Safari Extension**: Capture browsing history from Safari on iOS
- **Offline-First**: Continue working without internet connection with automatic background sync
- **Secure Sync**: Sync your browsing history securely across devices

## Development Setup

### Prerequisites

- Xcode 14.0 or later
- iOS 15.0 or later
- Swift 5.5 or later
- macOS 12.0 or later (for development)

### Getting Started

1. Clone the repository
2. Open `ChronicleSync.xcodeproj` in Xcode
3. Select your development team in the project settings
4. Build and run the app on your iOS device or simulator

### Testing the Safari Extension

1. Build and run the app on your iOS device
2. Open the app and tap "Enable Safari Extension"
3. In Safari Settings, enable the ChronicleSync extension under "Extensions"
4. Browse to a website to test the extension functionality

## Project Structure

```
ChronicleSync/
├── ChronicleSync/
│   ├── App/
│   │   ├── AppDelegate.swift
│   │   ├── SceneDelegate.swift
│   │   └── ChronicleSync.entitlements
│   ├── Views/
│   │   ├── ContentView.swift
│   │   ├── SettingsView.swift
│   │   └── SyncHistoryView.swift
│   ├── Models/
│   │   ├── SyncSettings.swift
│   │   └── HistoryItem.swift
│   ├── Services/
│   │   ├── SyncService.swift
│   │   └── ExtensionCommunicationService.swift
│   └── Resources/
│       ├── Assets.xcassets
│       └── Info.plist
├── ChronicleSync Extension/
│   ├── SafariWebExtensionHandler.swift
│   ├── Resources/
│   │   ├── background.js
│   │   ├── content-script.js
│   │   ├── popup.html
│   │   ├── popup.css
│   │   ├── popup.js
│   │   └── manifest.json
│   └── Info.plist
└── ChronicleSync Tests/
    ├── AppTests/
    │   ├── ContentViewTests.swift
    │   └── SyncServiceTests.swift
    └── ExtensionTests/
        ├── SafariExtensionTests.swift
        └── ExtensionCommunicationTests.swift
```

## CI/CD

The project includes GitHub Actions workflows for continuous integration and deployment:

- Automated building and testing on macOS
- Code quality checks with SwiftLint
- Archiving and uploading the app for distribution

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request