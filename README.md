# ChronicleSync

A modern, secure IndexedDB synchronization service built with Cloudflare Workers and Pages. ChronicleSync enables seamless data synchronization across browsers and devices while maintaining robust security and offline capabilities.

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
- **Secure**: End-to-end HTTPS encryption and robust access controls
- **Chrome Extension**: Easy-to-use browser integration with dedicated window interface
- **Real-time Monitoring**: Health monitoring and administrative dashboard

## Components

ChronicleSync consists of three main components:

1. **[Pages](pages/README.md)**: Frontend application and Chrome extension
   - React + TypeScript + Vite
   - Browser extension for history sync
   - Admin dashboard and monitoring

2. **[Worker](worker/README.md)**: Cloudflare Worker backend
   - Serverless architecture
   - Data synchronization
   - API endpoints

3. **Extension**: Chrome extension (part of Pages)
   - Built from pages/src
   - History capture and sync
   - Configurable settings
   - Offline support

## Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/chroniclesync.git
   cd chroniclesync
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   cd pages && npm install

   # Install backend dependencies
   cd ../worker && npm install
   ```

3. **Start Development**
   ```bash
   # Start frontend
   cd pages && npm run dev

   # Start worker (in another terminal)
   cd worker && npm run dev
   ```

See the component-specific READMEs for detailed development instructions:
- [Pages Development Guide](pages/README.md)
- [Worker Development Guide](worker/README.md)

## Testing

Run the full test suite:
```bash
./run_tests.sh
```

This will:
1. Run local tests for all components
2. Create a PR with test changes
3. Monitor CI/CD pipeline
4. Report results

## Deployment

- Frontend: `https://$BRANCH.chroniclesync.pages.dev`
- API:
  - Staging: `https://api-staging.chroniclesync.xyz`
  - Production: `https://api.chroniclesync.xyz`

> **Note**: Production deployments require approval and passing tests

## Future Enhancements

- **Privacy Controls**: Add encryption and filtering mechanisms
- **Advanced Search**: Implement full-text search capabilities in the static page
- **Data Retention**: Add configurable data retention policies per device
- **Selective Sync**: Allow users to choose which history items to sync