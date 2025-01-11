# ChronicleSync

IndexedDB synchronization service using Cloudflare Workers and Pages. Sync your client-side data across browsers and devices.

## Quick Start

1. **Initialize Client**
   ```javascript
   // Initialize with your unique client ID
   await initializeClient('your-client-id');
   ```

2. **Save Data**
   ```javascript
   // Save data locally
   await saveData({ key: 'value' });
   ```

3. **Sync with Server**
   ```javascript
   // Sync local data with cloud
   await syncData();
   ```

## Features

- 📱 **Offline-First**: Work offline, sync when online
- 🔄 **Manual Sync**: Explicit sync when needed
- 🔒 **Basic Security**: HTTPS and access controls
- 📊 **Admin Panel**: Monitor and manage client data
- ❤️ **Health Checks**: Real-time system monitoring

## Installation

```bash
npm install chroniclesync
```

## Basic Usage

```html
<script type="module">
  import { initializeClient } from 'chroniclesync';

  // Initialize with your client ID
  await initializeClient('your-client-id');

  // Save data locally
  await saveData({
    notes: 'Meeting notes',
    timestamp: new Date()
  });

  // Manually sync when needed
  document.getElementById('syncButton').onclick = async () => {
    await syncData();
  };
</script>
```

## API Reference

### Client Operations

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

### Admin Operations

```javascript
// Login as admin
await loginAdmin('your-admin-password');

// Get client statistics
await refreshStats();

// Delete client data
await deleteClient('client-123');
```

## Common Issues

1. **Sync Failed**
   - Check your internet connection
   - Verify client ID is correct
   - Ensure data is valid JSON

2. **Access Denied**
   - Verify admin credentials
   - Check your permissions
   - Ensure you're using HTTPS

3. **Data Not Saving**
   - Check browser storage permissions
   - Verify data format
   - Clear browser cache if needed

## Support

For help and bug reports, please:
- Open an issue: https://github.com/posix4e/chroniclesync/issues
- See the [DEVELOPMENT.md](DEVELOPMENT.md) file for technical details

## License

MIT © [OpenHands]
