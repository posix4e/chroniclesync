# ChronicleSync

IndexedDB synchronization service using Cloudflare Workers and Pages. Sync your client-side data across browsers and devices securely and efficiently.

## Features

- 📱 **Offline-First**: Work offline, sync when online
- 🔄 **Manual Sync**: Explicit sync when needed
- 🔒 **Enhanced Security**: HTTPS, access controls, and password manager support
- 📊 **Admin Panel**: Monitor and manage client data
- ❤️ **Health Checks**: Real-time system monitoring
- 🌐 **Cross-Device**: Seamless synchronization across devices
- 🚀 **Modern Architecture**: Separate UI for better security and usability

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- Chrome browser

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/posix4e/chroniclesync.git
   cd chroniclesync
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers (for testing):
   ```bash
   npx playwright install --with-deps chromium
   ```

### Development Workflow

1. Start the development servers:
   ```bash
   npm run dev
   ```
   This will start:
   - Pages development server (http://localhost:50800)
   - Worker development server (http://localhost:55440)
   - Extension build in watch mode

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/dist` directory

### Testing

ChronicleSync uses a comprehensive testing strategy:

1. Unit Tests:
   ```bash
   npm run test:unit
   ```

2. End-to-End Tests:
   ```bash
   npm run test:e2e
   ```

3. Staging Environment Tests:
   ```bash
   npm run test:e2e:staging
   ```

### Project Structure

The project is organized into three main components:

1. **Extension (`/extension`)**
   - `popup.html` - Minimal extension popup with launch button
   - `app.html` - Main application window
   - `manifest.json` - Extension configuration
   - `dist/` - Built extension files

2. **Pages (`/pages`)**
   - Server-rendered pages
   - API endpoints
   - Admin interface
   - Health monitoring

3. **Worker (`/worker`)**
   - Background sync service
   - Data processing
   - IndexedDB management

### API Reference

#### Client API

```javascript
// Initialize client
await initializeClient('client-123');

// Save data
await saveData({
  title: 'Note 1',
  content: 'Content here'
});

// Sync with server
await syncData();

// Check system health
await checkHealth();
```

#### Admin API

```javascript
// Login as admin
await loginAdmin('your-admin-password');

// Get client statistics
await refreshStats();

// Delete client data
await deleteClient('client-123');
```

### Troubleshooting

1. **Extension Issues**
   - Ensure the extension is built: `npm run build:extension`
   - Check Chrome's extension page for errors
   - Verify the extension has required permissions

2. **Sync Issues**
   - Check internet connectivity
   - Verify client ID is correct
   - Ensure data is valid JSON
   - Check browser console for errors

3. **Development Issues**
   - Verify all dependencies are installed
   - Ensure development servers are running
   - Check test logs for specific errors

### Support

For help and bug reports:
- Open an issue: https://github.com/posix4e/chroniclesync/issues
- Join our [Discord community](https://discord.gg/chroniclesync)
- Read the documentation in the `/docs` directory

### License

MIT © [OpenHands]
