# Cloudflare Sync Application

A simple application that demonstrates synchronization between IndexedDB and Cloudflare's D1/R2 storage using Cloudflare Workers and Pages.

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

4. Update the `API_URL` in `pages/src/js/main.js` with your worker's URL

## Repository Secrets

The following secrets need to be set in the GitHub repository:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Workers and Pages permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

## Development

### Worker
```bash
cd worker
npm install
npm run dev
```

### Pages
```bash
cd pages
npm install
npm run dev
```

## Deployment

Deployment is handled automatically by GitHub Actions when changes are pushed to the main branch:
- Changes in the `worker/` directory trigger worker deployment
- Changes in the `pages/` directory trigger pages deployment