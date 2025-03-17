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

### Project Structure

```
chroniclesync/
├── pages/          # Frontend React application
├── extension/      # Chrome extension
└── worker/         # Cloudflare Worker backend
```

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- **Path-Based Triggers**: The CI/CD pipeline for pages is only triggered when changes are made to the `pages/` directory
- **Manual Workflow**: You can also manually trigger the workflow using the GitHub Actions UI
- **Deployment**: Pages are automatically deployed to Cloudflare Pages when changes are detected in the pages directory

To modify the CI/CD pipeline configuration, see the workflow file at `.github/workflows/ci-cd-combined.yml`.
