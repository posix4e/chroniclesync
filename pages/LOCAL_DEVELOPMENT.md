# ChronicleSync Local Development Guide

This guide provides detailed instructions for setting up and running ChronicleSync locally for development.

## Prerequisites

### Required Software
- Node.js (>= 16)
- npm (>= 7)
- Git
- VS Code (recommended)

### Platform-Specific Requirements

#### For Safari Extension Development
- macOS system
- Xcode 15.0 or later
- Safari Technology Preview (recommended)

#### For Chrome Extension Development
- Chrome or Chromium browser
- Developer mode enabled

#### For Firefox Extension Development
- Firefox Developer Edition (recommended)
- web-ext tool (`npm install -g web-ext`)

## Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/chroniclesync.git
cd chroniclesync
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install worker dependencies
cd worker && npm install
cd ..

# Install pages dependencies
cd pages && npm install
cd ..
```

3. Configure environment:
```bash
# Copy example environment files
cp .env.example .env
cp worker/.env.example worker/.env
cp pages/.env.example pages/.env

# Edit the .env files with your settings
```

## Development Workflow

### Running the Development Server

1. Start the React development server:
```bash
cd pages
npm run dev
```
This will start the server at http://localhost:3000

2. Start the worker development server:
```bash
cd worker
npm run dev
```
This will start the worker at http://localhost:8787

### Testing

1. Run the test suites:
```bash
# In the pages directory
cd pages

# Unit and integration tests
npm run test

# E2E tests
npm run test:e2e

# Watch mode for development
npm run test:watch
```

2. Test the extensions:
```bash
# Chrome
npm run build:chrome
# Load unpacked extension from dist/chrome

# Firefox
npm run build:firefox
# Load temporary add-on from dist/firefox

# Safari
npm run build:safari
# Open the generated .app file
```

## Common Development Tasks

### Building Extensions

```bash
# Build all extensions
npm run build:extensions

# Build specific platform
npm run build:chrome
npm run build:firefox
npm run build:safari
```

### Debugging

1. React Application:
   - Use React Developer Tools
   - Check browser console
   - Use VS Code debugger

2. Extensions:
   - Chrome: chrome://extensions
   - Firefox: about:debugging
   - Safari: Develop menu

3. Worker:
   - Use wrangler dev --local
   - Check worker logs

## Environment Variables

Key variables for local development:

```env
# .env
API_URL=http://localhost:8787
NODE_ENV=development
DEBUG=true

# worker/.env
WORKER_SECRET=your-secret
DEBUG=true
```

## Database Setup

1. Local development uses IndexedDB
2. Worker development uses:
   - Local: SQLite
   - Production: Cloudflare D1

## Common Issues

### React Development Server

1. Port conflicts:
   ```bash
   # Change port
   PORT=3001 npm run dev
   ```

2. Hot reload not working:
   - Clear browser cache
   - Restart development server

### Extension Development

1. Chrome:
   - Clear extension from chrome://extensions
   - Reload unpacked extension

2. Firefox:
   - Use web-ext run
   - Clear browser cache

3. Safari:
   - Clean build directory
   - Rebuild extension

### Worker Development

1. Connection issues:
   - Check wrangler.toml
   - Verify environment variables
   - Check port conflicts

2. Database errors:
   - Verify migrations
   - Check connections

## Best Practices

1. Code Style
   - Run linter before commits
   - Follow TypeScript guidelines
   - Use consistent formatting

2. Testing
   - Write tests for new features
   - Run full suite before PR
   - Follow test naming conventions

3. Git Workflow
   - Use feature branches
   - Keep commits focused
   - Write clear commit messages

## Additional Resources

- [Development Guide](DEVELOPMENT.md)
- [Testing Guide](../TESTING.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

## Getting Help

If you encounter issues:
1. Check the troubleshooting section
2. Search existing issues
3. Ask in discussions
4. Open a new issue
