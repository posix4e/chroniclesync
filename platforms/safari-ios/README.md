# ChronicleSync Safari iOS Extension

This directory contains the Safari iOS extension for ChronicleSync.

## Project Structure

The Safari iOS extension consists of two main components:

1. **iOS App**: A container app that allows users to install and manage the Safari extension.
2. **Safari Extension**: The actual extension that runs in Safari.

## Development Setup

### Prerequisites

- Xcode 14.0 or later
- iOS 16.0 or later
- macOS 12.0 or later
- Apple Developer Account

### Creating the Xcode Project

1. Open Xcode and create a new project
2. Select "App" as the template
3. Name the project "ChronicleSync"
4. Select "SwiftUI App" for the interface
5. Select "Swift" for the language
6. Add a new target to the project
7. Select "Safari Extension App Extension" as the template
8. Name the extension "ChronicleSync Extension"

### Project Configuration

The Xcode project should be configured with the following settings:

- Bundle Identifier: `xyz.chroniclesync.ios`
- Extension Bundle Identifier: `xyz.chroniclesync.ios.extension`
- Deployment Target: iOS 16.0
- Capabilities:
  - App Groups (for sharing data between the app and extension)
  - Background Modes (for background sync)

## Implementation Details

### iOS App

The iOS app serves as a container for the Safari extension and provides the following functionality:

- User authentication
- Extension management
- Sync settings
- History viewing

### Safari Extension

The Safari extension provides the following functionality:

- Content script for capturing browsing history
- Background script for syncing data
- Popup UI for quick access to features

### Data Synchronization

Data synchronization between the iOS app and the Safari extension is handled through App Groups. The shared container allows both the app and extension to access the same data.

## Building and Testing

To build and test the Safari iOS extension:

1. Open the Xcode project
2. Select the appropriate scheme (iOS app or Safari extension)
3. Build and run on a simulator or device

## Distribution

To distribute the Safari iOS extension:

1. Archive the Xcode project
2. Upload to App Store Connect
3. Submit for review