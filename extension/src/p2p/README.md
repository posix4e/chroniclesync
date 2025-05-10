# P2P Synchronization for ChronicleSync

This module implements peer-to-peer synchronization for ChronicleSync using WebRTC.

## Overview

The P2P sync functionality allows devices to synchronize history data directly with each other without requiring a central server. This is particularly useful for:

1. Enhanced privacy (data never passes through a central server)
2. Cross-platform compatibility (works with iOS and other platforms that support WebRTC)
3. Offline capability (devices can sync when on the same local network)

## Implementation Details

### P2PSync Class

The main class that handles all P2P functionality:

- **Connection Management**: Establishes and maintains WebRTC connections with peers
- **Discovery**: Uses a lightweight WebSocket server for peer discovery and signaling
- **Encryption**: Implements end-to-end encryption using keys derived from the shared mnemonic
- **Data Exchange**: Handles sending and receiving history entries and device information

### Security

- All data is encrypted end-to-end using AES-GCM
- The encryption key is derived from the shared mnemonic using PBKDF2
- The discovery server only helps peers find each other and exchange signaling information
- No sensitive data is ever sent to the discovery server

### Message Types

- `ping/pong`: Connection health checks
- `history`: History entries being synchronized
- `device`: Device information updates
- `sync-request/sync-response`: Full sync operations

## Usage

To use P2P sync:

1. Enable P2P sync mode in the extension settings
2. Enter the same mnemonic phrase on all devices you want to sync
3. Optionally configure a custom discovery server
4. Start syncing directly between your devices

## iOS Compatibility

The WebRTC protocol used for P2P sync is compatible with iOS devices. An iOS client can implement the same protocol to sync with Chrome extensions using:

- The same WebRTC connection establishment process
- The same encryption scheme (AES-GCM with keys derived from the shared mnemonic)
- The same message format for exchanging history and device data

## Discovery Service

The P2P discovery service is integrated into the Cloudflare Worker backend. It:

1. Maintains a list of connected clients using WebSockets
2. Groups clients into rooms based on a shared room ID derived from the mnemonic
3. Notifies clients when new peers join their room
4. Relays WebRTC signaling messages between peers
5. Does not have access to any of the actual synchronized data

The discovery service is implemented in the Cloudflare Worker's WebSocket handlers.