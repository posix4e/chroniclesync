# ChronicleSync Worker Developer Guide

This guide provides detailed information for developers working on the ChronicleSync Cloudflare Worker component, which handles data synchronization and backend operations.

## Architecture

The ChronicleSync Worker is built on Cloudflare Workers and provides:
- Data synchronization endpoints
- Authentication and authorization
- Conflict resolution
- Real-time data propagation

### Key Components

```
worker/
├── src/                 # Source code
├── wrangler.toml       # Cloudflare Workers configuration
└── package.json        # Dependencies and scripts
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Cloudflare:
   ```bash
   npx wrangler login
   ```

3. Start local development:
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables

Configure these in `wrangler.toml` or through Cloudflare's dashboard:

```toml
[vars]
ENVIRONMENT = "development"
```

### Wrangler Configuration

The `wrangler.toml` file contains:
- Worker name and routes
- Environment variables
- KV namespace bindings
- Durable Objects configurations

## API Endpoints

### Sync Operations

#### `POST /api/sync`
Synchronize data between client and server.

Request:
```json
{
  "changes": [
    {
      "key": "string",
      "value": "any",
      "timestamp": "number"
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "conflicts": [],
  "synced": []
}
```

#### `GET /api/status`
Get synchronization status.

Response:
```json
{
  "status": "string",
  "lastSync": "timestamp",
  "pending": "number"
}
```

### Authentication

#### `POST /api/auth`
Authenticate a client.

Request:
```json
{
  "token": "string"
}
```

Response:
```json
{
  "success": true,
  "session": "string"
}
```

## Data Storage

### KV Storage
- Used for metadata and configuration
- Namespace: `CHRONICLE_KV`

### Durable Objects
- Used for maintaining sync state
- Handles conflict resolution
- Stores temporary sync data

## Testing

1. Run unit tests:
   ```bash
   npm run test
   ```

2. Run integration tests:
   ```bash
   npm run test:integration
   ```

3. Run specific test file:
   ```bash
   npm test -- worker/src/handlers/sync.test.js
   ```

## Deployment

1. Test the build:
   ```bash
   npm run build
   ```

2. Deploy to Cloudflare:
   ```bash
   npm run deploy
   ```

3. Deploy to specific environment:
   ```bash
   npm run deploy:prod
   ```

## Monitoring and Debugging

### Logging
Use Cloudflare's logging system:
```javascript
console.log("Debug message");
console.error("Error message");
```

### Metrics
Available in Cloudflare Dashboard:
- Request count
- Error rate
- CPU time
- Memory usage

## Error Handling

1. HTTP Errors:
   ```javascript
   throw new HTTPError(403, "Unauthorized access");
   ```

2. Sync Errors:
   ```javascript
   throw new SyncError("Conflict detected", conflictData);
   ```

## Performance Optimization

1. Cache Strategy:
   - Use Cloudflare's cache API
   - Implement appropriate cache headers
   - Cache frequently accessed data

2. Batch Operations:
   - Group multiple changes
   - Use bulk operations where possible

3. Resource Management:
   - Minimize memory usage
   - Optimize CPU intensive operations

## Security Considerations

1. Authentication:
   - Validate all tokens
   - Use secure session management
   - Implement rate limiting

2. Data Access:
   - Validate permissions
   - Sanitize input
   - Encrypt sensitive data

3. CORS Configuration:
   - Configure allowed origins
   - Handle preflight requests
   - Validate headers

## Troubleshooting

### Common Issues

1. **Deployment Failures**
   - Verify wrangler.toml configuration
   - Check account permissions
   - Validate environment variables

2. **Sync Issues**
   - Check client timestamps
   - Verify data format
   - Monitor conflict resolution

3. **Performance Problems**
   - Review CPU usage
   - Check memory limits
   - Analyze request patterns

## Contributing

1. Follow the coding style
2. Add tests for new features
3. Update documentation
4. Use meaningful commit messages