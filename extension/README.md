# ChronicleSync Extension

The Chrome extension component of ChronicleSync that handles browser history synchronization.

## Architecture

### Core Components

1. **Background Script** ([background.ts](../pages/src/background.ts))
   - Manages IndexedDB for local history storage
   - Handles periodic sync with server
   - Listens for browser history events
   - Manages extension configuration

2. **Popup Interface** ([popup.html](./popup.html))
   - User interface for configuration
   - Sync status and controls
   - Client initialization
   - History viewing

### Data Flow

1. History Capture:
   - Browser history events trigger background script
   - Events are stored in IndexedDB with timestamps
   - Deduplication happens at storage time

2. Synchronization:
   - Periodic sync based on configured interval
   - Only syncs entries within retention period
   - Uses server API for data transfer
   - Handles offline scenarios gracefully

### Security

- Client authentication required
- HTTPS for all API communication
- Data validation at multiple levels
- TODO: Add end-to-end encryption

## Integration Points

- Uses React components from [pages/src/components](../pages/src/components)
- Shares utilities with main app from [pages/src/utils](../pages/src/utils)
- API integration defined in worker component

## Testing

See [pages/e2e](../pages/e2e) for end-to-end tests covering:
- Extension initialization
- History capture
- Sync functionality
- Error handling

## Future Improvements

1. Performance
   - Batch history updates
   - Optimize IndexedDB queries
   - Implement incremental sync

2. Features
   - Selective sync by domain
   - Custom retention policies
   - History search
   - Sync status indicators