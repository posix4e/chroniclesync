# P2P History Sync Chrome Extension

A Chrome MV3 extension that syncs browser history across devices using P2P WebRTC connections without any central server.

## Features

- Peer-to-peer synchronization of browser history using WebRTC via Hyperswarm-Web
- End-to-end encryption using AES-GCM with keys derived from a shared secret
- Automatic hourly synchronization using Chrome alarms
- Persistent connections via Offscreen Documents in MV3
- Simple UI showing sync status and last sync time

## Technical Details

- Uses Automerge CRDT for conflict-free history merging
- Encrypts all sync data with AES-GCM using PBKDF2-derived keys
- WebRTC discovery via Hyperswarm-Web with topic derived from shared secret
- Stores history data in IndexedDB for persistence
- Runs in the background using Chrome's alarm API

## Development

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/p2p-history-sync.git
   cd p2p-history-sync
   ```

2. Install dependencies:
   ```
   cd chrome-mv3
   npm install
   ```

3. Build the extension:
   ```
   npm run build
   ```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `dist` directory from the project

## Testing

To test the extension across two Chrome profiles:

1. Create a new Chrome profile (or use an existing second profile)
2. Load the extension in both profiles
3. Set the same sync secret in both extensions
4. Browse some websites in each profile
5. Wait for the automatic sync (up to 60 minutes) or click "Sync Now" in the popup
6. Verify that history items appear in both profiles

## Security

- All data is encrypted end-to-end using AES-GCM
- The shared secret never leaves the client
- No external servers are used except for STUN servers for WebRTC connection establishment
- The encryption key is derived using PBKDF2 with 100,000 iterations

## License

MIT