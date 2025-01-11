# ChronicleSync Development Documentation

Internal development documentation for OpenHands team.

## Architecture Overview

### Frontend Stack
- ES modules for code organization
- IndexedDB for local storage
- Environment-aware API endpoints
- CSP and SRI for security

### Security Implementation
1. Content Security Policy
   ```javascript
   const cspDirectives = [
     "default-src 'self'",
     "script-src 'self' 'unsafe-inline'",
     "connect-src 'self' ${finalOrigin}"
   ];
   ```

2. Module System
   - ES modules with SRI validation
   - Build-time integrity checks
   - Explicit global assignments for event handlers

3. CORS Configuration
   ```javascript
   const allowedDomains = [
     'chroniclesync.xyz',
     'chroniclesync-pages.pages.dev'
   ];
   ```

### Known Issues & Solutions

1. Module Loading
   - Issue: Global function availability with ES modules
   - Solution: Explicit window assignments in module scope
   ```javascript
   import { fn } from './module.js';
   window.fn = fn;
   ```

2. Security Headers
   - CSP must allow 'unsafe-inline' for current implementation
   - SRI hashes generated during build
   - CORS requires specific origin handling

### Environment Configuration

Production:
- Frontend: chroniclesync.xyz
- API: api.chroniclesync.xyz
- Strict CSP
- Full SRI validation

Staging:
- Frontend: *.chroniclesync-pages.dev
- API: api-staging.chroniclesync.xyz
- Development-friendly CSP
- SRI validation optional

### Build Process
1. SRI hash generation
2. Module bundling
3. Environment-specific configs
4. Security header injection

### Testing Requirements
- CSP compliance
- CORS behavior
- Module integrity
- Security headers
- Error scenarios

### Deployment Checklist
1. Generate SRI hashes
2. Verify CSP compatibility
3. Check CORS settings
4. Validate security headers
5. Clear CDN cache

### Internal Notes
- Keep CSP as strict as possible
- Monitor for CSP violations
- Regular security audits
- Document all header changes