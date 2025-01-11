# ChronicleSync

A simple application that demonstrates synchronization between IndexedDB and Cloudflare's R2 storage using Cloudflare Workers and Pages.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with:
  - Workers subscription

## Project Structure

```
.
├── .github/workflows/    # CI/CD pipeline configurations
├── pages/               # Frontend application
│   ├── src/            # Source code
│   └── public/         # Static assets
├── worker/             # Cloudflare Worker backend
│   ├── src/           # Worker source code
│   └── wrangler.toml  # Worker configuration
```

## Environments

The application supports two environments:

### Production
- Frontend: https://chroniclesync.xyz
- API: https://api.chroniclesync.xyz
- Uses production R2 bucket
- Deployed when changes are merged to main branch

### Preview (Staging)
- Frontend: Automatically deployed to `chroniclesync.pages.dev` by Cloudflare Pages
- API: https://api-staging.chroniclesync.xyz
- Uses separate staging R2 bucket
- Preview deployments are created automatically for each branch
- Branch previews are available at `[branch-name].chroniclesync.pages.dev`
- The preview deployment serves as the staging environment

## Components

## Frontend Architecture

The frontend application is built with a modular JavaScript architecture:

### Core Components
- **Database Layer** (`db.js`): Handles all IndexedDB operations
- **Main Application** (`main.js`): Contains business logic and UI interactions
- **Environment-aware API**: Automatically selects the correct API endpoint based on the deployment environment

### Key Features
1. **Client Management**
   - Unique client identification
   - Local data persistence using IndexedDB
   - Automatic data synchronization with backend

2. **Admin Interface**
   - Client statistics and monitoring
   - Data size tracking
   - Client deletion capabilities
   - Secure access control

3. **Health Monitoring**
   - System health checks
   - Real-time status updates
   - Error reporting and tracking

### API Integration
- Automatic endpoint selection based on hostname:
  - Production: api.chroniclesync.xyz
  - Staging: api-staging.chroniclesync.xyz
  - Local: localhost:8787

### Security Considerations
- Admin access is password-protected
- All API requests use proper headers
- Sensitive operations require authentication
- Environment-specific API endpoints prevent cross-environment data leaks

### Worker
- Handles data synchronization
- Provides admin interface for monitoring

### Pages
- Client interface for data management
- Admin interface for monitoring
- Uses IndexedDB for local storage
- Automatic synchronization with worker
- Built with ES modules for better code organization
- Features:
  - Client data management with unique client IDs
  - Admin panel with client statistics
  - System health monitoring
  - Automatic API endpoint selection based on environment
  - Secure admin access with password protection

## Initial Setup

### Cloudflare Resources Setup

Before deploying the application, you need to manually set up the required Cloudflare resources. This is a one-time setup process that needs to be done for each environment (staging and production).

5. **Configure Custom Domains** in your DNS settings:
   - Production API: `api.chroniclesync.xyz`
   - Staging API: `api-staging.chroniclesync.xyz`
   - Frontend Production: `chroniclesync.xyz`
   - Frontend Staging: `staging.chroniclesync.xyz`

> **Note**: The Cloudflare resource setup is a manual process and is not part of the automated CI/CD pipeline. This ensures better control over infrastructure changes and prevents accidental modifications to production resources.

## Repository Secrets

The following secrets need to be set in the GitHub repository:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with the following permissions:
  - Account.Workers Scripts:Edit
  - Account.Workers Routes:Edit
  - Account.Pages:Edit
  - Zone.DNS:Edit (if using custom domains)
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

To set up these secrets:
1. Go to your Cloudflare dashboard (https://dash.cloudflare.com)
2. Get your Account ID from the dashboard URL or Account Home
3. Create an API token at "My Profile" > "API Tokens" with the required permissions
4. Add both secrets in your GitHub repository under "Settings" > "Secrets and variables" > "Actions"

## Development

### Worker Development
```bash
cd worker
npm install
npm run dev
```

### Pages Development
```bash
cd pages
npm install
npm run dev
```

The pages application will be available at `http://localhost:5173` by default.

## Testing

The project includes automated tests to ensure functionality:

```bash
# Run worker tests
cd worker
npm test

# Run pages tests
cd pages
npm test
```

Tests are automatically run in GitHub Actions on pull requests and pushes to the main branch.

## Troubleshooting

Common issues and solutions:

1. **Worker deployment fails**
   - Verify your Cloudflare API token has the correct permissions
   - Ensure wrangler.toml is properly configured with correct database IDs
   - Verify you're using the correct environment (staging vs production)

3. **Local development issues**
   - Clear browser IndexedDB data if sync issues occur
   - Verify environment variables are set correctly
   - Check browser console for error messages
   - Ensure wrangler is logged in (`wrangler login`)

4. **Sync not working**
   - Verify API_URL is correctly set in pages configuration
   - Check network connectivity and CORS settings
   - Ensure IndexedDB is supported and enabled in your browser
   - Verify R2 bucket permissions and access
   - Check browser console for JavaScript errors

5. **JavaScript functionality issues**
   - Ensure script tags have `type="module"` when using ES modules
   - Check that all required functions are properly exported/imported
   - Verify global functions are explicitly assigned to window object
   - Clear browser cache if changes aren't reflecting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure tests pass and add new tests for new features.

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment. The pipeline consists of three main jobs:

### Test Job
- Runs for both pull requests and pushes to main
- Tests both worker and pages projects in parallel
- Performs:
  - npm dependency installation
  - Code linting
  - Test coverage reporting

### Deploy Jobs
Deployment is handled automatically by GitHub Actions when changes are pushed to the main branch:

#### Pages Deployment
- Deploys the frontend application to Cloudflare Pages
- Requires successful test job completion
- Uses Cloudflare API token for authentication
- Deploys to:
  - Production: chroniclesync.xyz (on main branch push)
  - Staging: staging.chroniclesync.xyz (on pull requests)

#### Worker Deployment
- Deploys the backend worker to Cloudflare Workers
- Requires successful test job completion
- Uses Cloudflare API token for authentication
- Deploys to:
  - Production: api.chroniclesync.xyz (on main branch push)
  - Staging: api-staging.chroniclesync.xyz (on pull requests)

### Environment Protection
- Deployments only run on the main branch
- Environment-specific variables and secrets are scoped appropriately
- Staging deployments are created for pull requests
- Production deployments only occur after merging to main
