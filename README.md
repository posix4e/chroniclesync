# ChronicleSync

A simple application that demonstrates synchronization between IndexedDB and Cloudflare's D1/R2 storage using Cloudflare Workers and Pages.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with:
  - Workers subscription
  - Access to D1 and R2 services
  - A registered domain (optional, for custom domains)

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

### Staging
- Frontend: https://staging.chroniclesync.xyz
- API: https://api-staging.chroniclesync.xyz
- Uses separate staging D1 database and R2 bucket
- Used for testing changes before production deployment

## Components

### Worker
- Handles data synchronization
- Uses D1 for metadata storage
- Uses R2 for client data storage
- Provides admin interface for monitoring

### Pages
- Client interface for data management
- Admin interface for monitoring
- Uses IndexedDB for local storage
- Automatic synchronization with worker

## Setup

1. Create a D1 database:
```bash
npx wrangler d1 create sync_db
```

2. Create an R2 bucket:
```bash
npx wrangler r2 bucket create sync-storage
```

3. Update the `worker/wrangler.toml` with your D1 database ID

4. Configure custom domains in your DNS settings:
   - Production API: `api.chroniclesync.xyz`
   - Staging API: `api-staging.chroniclesync.xyz`
   - Frontend Production: `chroniclesync.xyz`
   - Frontend Staging: `staging.chroniclesync.xyz`

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

### Local Environment Setup

1. Clone the repository
2. Install dependencies for both worker and pages:
```bash
# Install worker dependencies
cd worker
npm install

# Install pages dependencies
cd ../pages
npm install
```

3. Create a `.dev.vars` file in the worker directory with required environment variables:
```
# worker/.dev.vars
ENVIRONMENT=development
```

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
   - Check that D1 database and R2 bucket exist
   - Ensure wrangler.toml is properly configured

2. **Local development issues**
   - Clear browser IndexedDB data if sync issues occur
   - Verify environment variables are set correctly
   - Check browser console for error messages

3. **Sync not working**
   - Verify API_URL is correctly set in pages configuration
   - Check network connectivity and CORS settings
   - Ensure IndexedDB is supported and enabled in your browser

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