# ChronicleSync Pages Developer Guide

This guide covers the development of the ChronicleSync web application built with React and deployed on Cloudflare Pages.

## Architecture

The web application is built using:
- React for the UI framework
- Cloudflare Pages for hosting
- IndexedDB for local data storage
- WebSocket for real-time sync

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
pages/
├── src/
│   ├── components/    # Reusable React components
│   ├── hooks/        # Custom React hooks
│   ├── pages/        # Page components
│   ├── services/     # API and service functions
│   └── utils/        # Helper utilities
├── public/           # Static assets
└── e2e/             # End-to-end tests
```

## Testing

- Run unit tests:
  ```bash
  npm run test
  ```

- Run E2E tests:
  ```bash
  npm run test:e2e
  ```

## Key Features

### Data Synchronization
The web application implements real-time synchronization with:
- IndexedDB for local storage
- WebSocket connections for live updates
- Conflict resolution strategies

### Authentication
- OAuth integration
- Session management
- Role-based access control

### Monitoring
- Real-time sync status
- Error tracking
- Performance metrics

## API Integration

### Worker API Endpoints
- `POST /api/sync`: Synchronize data
- `GET /api/status`: Get sync status
- `GET /api/health`: Health check endpoint

### WebSocket Events
- `sync:start`: Sync process started
- `sync:complete`: Sync completed
- `sync:error`: Sync error occurred

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Cloudflare Pages:
   ```bash
   npm run deploy
   ```

## Performance Optimization

1. **Code Splitting**
   - Use dynamic imports for route-based code splitting
   - Lazy load heavy components

2. **Caching Strategy**
   - Implement service workers for offline support
   - Cache static assets

3. **State Management**
   - Use React Query for server state
   - Implement efficient local state management

## Debugging

1. Development Tools:
   - React DevTools for component inspection
   - Network tab for API calls
   - Application tab for IndexedDB inspection

2. Common Issues:
   - Check WebSocket connection status
   - Verify IndexedDB permissions
   - Monitor memory usage

## Contributing

1. Follow the coding style guide
2. Write tests for new features
3. Update documentation as needed
4. Submit pull requests with clear descriptions