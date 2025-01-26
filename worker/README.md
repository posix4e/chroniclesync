# ChronicleSync Worker

The worker component of ChronicleSync handles the server-side synchronization and data management using Cloudflare Workers.

## Development

### Prerequisites
- Cloudflare account with Workers enabled
- Node.js 18 or later
- npm package manager

### Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

   This will start the worker in development mode using Wrangler.

### Testing

Run the worker tests:
```bash
npm test
```

### Deployment

The worker is automatically deployed to the following environments:
- Staging: `https://api-staging.chroniclesync.xyz`
- Production: `https://api.chroniclesync.xyz`

Deployments are handled by the CI/CD pipeline when changes are merged to the main branch.

## API Documentation

### Endpoints

#### POST /sync
Synchronizes browser history data.

**Request Headers:**
- `Content-Type: application/json`
- `X-Client-ID: string` (required)

**Request Body:**
```json
{
  "entries": [
    {
      "url": "string",
      "title": "string",
      "timestamp": "number"
    }
  ]
}
```

**Response:**
- 200: Sync successful
- 400: Invalid request format
- 401: Invalid client ID
- 500: Server error

## Architecture

The worker uses:
- Cloudflare Workers KV for data storage
- Durable Objects for consistency
- Web Crypto API for security