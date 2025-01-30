# ChronicleSync

A modern, secure IndexedDB synchronization service built with Cloudflare Workers and Pages. ChronicleSync enables seamless data synchronization across browsers and devices while maintaining robust security and offline capabilities.

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Secure**: End-to-end HTTPS encryption and robust access controls
- **Chrome Extension**: Easy-to-use browser integration with dedicated window interface
- **Real-time Monitoring**: Health monitoring and administrative dashboard

### Extension Features

- **First-Time Setup**: Automatic settings configuration on first installation
- **Settings Management**:
  - Configure API endpoint for backend communication
  - Set Pages UI URL for frontend interface
  - Manage client ID for authentication
  - Settings accessible via popup window for password manager compatibility
- **Persistent Configuration**: Settings are stored securely and persist across sessions
- **Form Validation**: Input validation with clear error messages
- **Error Handling**: Graceful handling of API errors and network issues
- **Reset Capability**: Option to reset settings to default values

## Development

### Prerequisites
- GitHub account with repository access
- Cloudflare account for deployments
- Node.js 18 or later
- npm package manager

### Local Development Setup
Checkout the github actions for info on building it

### Testing

The extension includes both unit tests and end-to-end tests:

#### Unit Tests
```bash
cd extension
npm run test
```

#### End-to-End Tests
```bash
cd extension
npm run test:e2e
```

The e2e tests generate screenshots in the `test-results` directory, documenting the extension's behavior at each step:
1. First-time settings page
2. Settings saved successfully
3. Initial popup state
4. Initialized popup state
5. Settings accessed from popup


### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
│   ├── src/        # Source code
│   └── e2e/        # End-to-end tests for pages
├── extension/      # Chrome extension
│   ├── src/        # Extension source code
│   └── e2e/        # End-to-end tests for extension
└── worker/         # Cloudflare Worker backend
```
