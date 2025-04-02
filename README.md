# ChronicleSync

Sync browsing history and summaries across browsers

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Privacy-Focused**: Only syncs summaries and history information, never stores or syncs full page content
- **Efficient Search**: Search through summaries and history information, not full content
- **Not Secure**: I'm to lazy and the models suck too much for local encryption, but it's coming.
- **Not Multiplatform**: We haven't added IOS support cause basic stuff still doesn't work.
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Quick Start

### Prerequisites
- GitHub CI/CD
- Cloudflare account for deployments
- Node.js ... Just read the github actions

### Developer Documentation
- [Extension Developer Guide](extension/DEVELOPER.md) - Detailed guide for Chrome extension development
- [Web Application Developer Guide](pages/DEVELOPER.md) - Complete documentation for the React web application
- [Worker Developer Guide](worker/DEVELOPER.md) - Comprehensive guide for the Cloudflare Worker backend

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Chrome extension
└── worker/         # Cloudflare Worker backend
```

### Administration

#### Key Structure
ChronicleSync uses the following key structure:

- **Client IDs**: Base64url-encoded SHA-256 hash of the BIP39 mnemonic (~43 characters)
- **KV Storage**: Keys are the client IDs directly
- **R2 Storage**: Keys follow the pattern `${clientId}/d` for client data

#### Clearing KV Storage
To clear out all keys in a KV namespace:

```bash
wrangler kv:key list --namespace-id=$NS | jq -r '.[] | .name' | while read key; do wrangler kv:key delete "$key" --namespace-id=$NS; done
```

Replace `$NS` with your namespace ID.
