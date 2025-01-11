# ChronicleSync Worker

This worker uses Cloudflare Workers with R2 storage and D1 database for data synchronization.

## ⚠️ Important Setup Instructions and Safeguards

### Prerequisites
- Cloudflare Wrangler CLI must be installed
- You must be authenticated with `wrangler login`
- This must be run by a human operator, not by automated systems or AI assistants

### Setup Process

1. **IMPORTANT: Manual Authentication Required**
   - You MUST run `wrangler login` manually before running the setup script
   - The setup script includes safeguards to prevent execution by automated systems

2. **Running the Setup Script**
   ```bash
   cd worker/setup
   chmod +x setup.sh
   ./setup.sh
   ```

3. **What the Setup Script Does**
   - Creates new R2 bucket with timestamp-based naming
   - Creates new D1 database with timestamp-based naming
   - Configures wrangler.toml with the new bindings
   - Applies database schemas
   - Tests the infrastructure

### ⚠️ Safety Measures
- The setup script CANNOT and SHOULD NOT be run by AI assistants or automated systems
- Each run creates new, uniquely named resources to prevent conflicts
- Infrastructure tests are performed to verify the setup
- Manual authentication is required to ensure proper access

### Resource Naming Convention
Resources are created with timestamp-based names in the format:
- R2 Bucket: `chroniclesync-bucket-YYYYMMDD-N`
- D1 Database: `chroniclesync-db-YYYYMMDD-N`

Where:
- YYYYMMDD is the current date
- N is an incremental counter to ensure uniqueness

## Development

After setup, you can develop your worker code in the `src` directory. The infrastructure bindings will be available as:
- R2 Bucket: `STORAGE`
- D1 Database: `DB`