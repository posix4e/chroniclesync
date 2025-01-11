# ChronicleSync

A simple application that demonstrates synchronization between IndexedDB and Cloudflare's D1/R2 storage using Cloudflare Workers and Pages.

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
- Uses production D1 database and R2 bucket
- Deployed when changes are merged to main branch

### Preview (Staging)
- Frontend: Automatically deployed to `chroniclesync.pages.dev` by Cloudflare Pages
- API: https://api-staging.chroniclesync.xyz
- Uses separate staging D1 database and R2 bucket
- Preview deployments are created automatically for each branch
- Branch previews are available at `[branch-name].chroniclesync.pages.dev`
- The preview deployment serves as the staging environment

## Components

### Worker
- Handles data synchronization
- Provides admin interface for monitoring

### Pages
- Client interface for data management
- Admin interface for monitoring
- Uses IndexedDB for local storage
- Automatic synchronization with worker

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
   - Verify D1 database permissions and schema

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure tests pass and add new tests for new features.

## Deployment

Deployment is handled automatically by GitHub Actions when changes are pushed to the main branch:
- Changes in the `worker/` directory trigger worker deployment
- Changes in the `pages/` directory trigger pages deployment
