# ChronicleSync

Sync stuff across browsers

## Features

- **Offline-First**: Continue working without internet connection with automatic background sync
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
- [CI/CD Documentation](.github/CICD.md) - Detailed information about the CI/CD workflow

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Chrome extension
└── worker/         # Cloudflare Worker backend
```

## CI/CD Workflow

The project uses GitHub Actions for continuous integration and deployment. The workflow has been optimized to only build, test, and deploy components when their relevant files have changed.

### Workflow Features

- **Path-Based Triggers**: The workflow only runs when files in specific directories are changed
- **Component-Specific Jobs**: Each component (pages, extension, worker) has its own job that only runs when relevant files change
- **Manual Component Selection**: You can manually trigger the workflow and specify which components to build/test/deploy
- **Browser Testing**: Extension tests can be run on specific browsers (Chrome, Firefox) or all browsers

### Manual Workflow Trigger

You can manually trigger the workflow with the following options:

- **Browser**: Select a specific browser for testing (chromium, firefox, or leave empty for all browsers)
- **API Endpoint**: Specify a custom API endpoint for testing
- **Debug Mode**: Enable debug mode for more verbose output
- **Components**: Comma-separated list of components to build/test/deploy (pages,extension,worker)

For example, to only build and test the extension component, you can trigger the workflow with `components=extension`.

You can also use the provided script to trigger the workflow:

```bash
# Only build and test the pages component
./scripts/trigger-workflow.sh pages

# Only build and test the extension component with Chrome
./scripts/trigger-workflow.sh extension chromium

# Build and test multiple components with debug mode
./scripts/trigger-workflow.sh pages,worker "" true

# Build and test all components with a custom API endpoint
./scripts/trigger-workflow.sh pages,extension,worker "" false https://custom-api.example.com
```
