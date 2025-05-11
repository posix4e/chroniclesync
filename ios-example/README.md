# ChronicleSync iOS P2P Client Example

This directory contains an example implementation of a P2P sync client for iOS that is compatible with the ChronicleSync Chrome extension.

## Overview

The `P2PSyncClient.swift` file demonstrates how to implement WebRTC-based peer-to-peer synchronization on iOS devices that can communicate with the Chrome extension. This enables direct device-to-device synchronization without requiring a central server.

## Requirements

- iOS 13.0+
- Swift 5.0+
- WebRTC framework (can be installed via CocoaPods or Swift Package Manager)

## Installation

### CocoaPods

Add the following to your Podfile:

```ruby
pod 'WebRTC-SDK', '~> 104.0'
```

### Swift Package Manager

Add the WebRTC dependency to your Package.swift:

```swift
dependencies: [
    .package(url: "https://github.com/webrtc-sdk/Specs.git", from: "104.0.0")
]
```

## Usage

### Initialization

```swift
import WebRTC

// Initialize the client with your device ID, discovery server URL, and shared mnemonic
let client = P2PSyncClient(
    clientId: "ios-device-123",
    discoveryServer: "wss://api.chroniclesync.xyz",
    mnemonic: "your shared mnemonic phrase"
)

// Set up callbacks
client.onHistoryReceived = { entries in
    // Handle received history entries
    for entry in entries {
        print("Received history entry: \(entry.title)")
    }
}

client.onDeviceReceived = { device in
    // Handle received device info
    print("Received device info: \(device.name)")
}

client.onConnectionStatusChanged = { isConnected in
    // Update UI based on connection status
    print("P2P connection status: \(isConnected ? "Connected" : "Disconnected")")
}

// Connect to the discovery server
client.connect()
```

### Sending Data

```swift
// Send history entries to connected peers
let historyEntry = HistoryEntry(
    id: "entry-123",
    url: "https://example.com",
    title: "Example Website",
    timestamp: Date().timeIntervalSince1970,
    deviceId: "ios-device-123"
)
client.sendHistoryEntries([historyEntry])

// Send device info to connected peers
let deviceInfo = DeviceInfo(
    id: "ios-device-123",
    name: "iPhone 13",
    type: "mobile",
    lastSeen: Date().timeIntervalSince1970
)
client.sendDeviceInfo(deviceInfo)

// Request sync from connected peers
client.requestSync()
```

### Cleanup

```swift
// Disconnect when done
client.disconnect()
```

## How It Works

1. **Discovery**: The client connects to the WebSocket discovery service in the Cloudflare Worker
2. **Connection**: WebRTC establishes direct connections with other devices using the discovery service for signaling
3. **Authentication**: Devices authenticate each other using the shared mnemonic phrase
4. **Encryption**: All data is encrypted end-to-end using keys derived from the shared mnemonic
5. **Synchronization**: History entries and device information are exchanged directly between devices

## Compatibility with Chrome Extension

This iOS client implementation is designed to be compatible with the ChronicleSync Chrome extension's P2P sync protocol. It uses:

- The same WebSocket discovery service
- The same WebRTC signaling protocol
- The same message format for exchanging data
- The same encryption scheme (AES-GCM with keys derived from the shared mnemonic)

## Security Considerations

- All data is encrypted end-to-end using keys derived from the shared mnemonic
- The discovery service only helps peers find each other and exchange signaling information
- No actual history data passes through the discovery service
- The discovery service has no access to the encryption keys or the content of the messages

## Limitations

This example implementation:

- Does not include a complete encryption implementation (you would need to implement this using CommonCrypto or CryptoKit)
- Does not include error handling for all edge cases
- Does not include a complete UI implementation
- Is meant as a reference for implementing the protocol, not as production-ready code

## Further Improvements

- Implement complete encryption using CryptoKit (iOS 13+)
- Add more robust error handling and reconnection logic
- Add support for local network discovery using Bonjour/mDNS
- Implement a complete UI for managing connections and viewing sync status
- Add support for syncing more data types