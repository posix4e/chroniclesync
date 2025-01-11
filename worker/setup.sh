#!/bin/bash
set -e

# Ensure this is being run by a human
if [ -z "$PS1" ] && [ -z "$SSH_CLIENT" ] && [ -z "$SSH_TTY" ]; then
    echo "This script must be run interactively by a human operator."
    echo "It cannot be run in a non-interactive or automated environment."
    exit 1
fi

# Check if wrangler is logged in
if ! wrangler whoami >/dev/null 2>&1; then
    echo "Error: You must run 'wrangler login' first"
    exit 1
fi

# Generate timestamp and counter for unique resource names
TIMESTAMP=$(date +%Y%m%d)
COUNTER=1

# Find next available counter
while wrangler r2 bucket list 2>/dev/null | grep -q "storage-${TIMESTAMP}-${COUNTER}" || \
      wrangler d1 list 2>/dev/null | grep -q "database-${TIMESTAMP}-${COUNTER}"; do
    COUNTER=$((COUNTER + 1))
done

echo "Creating resources with timestamp ${TIMESTAMP} and counter ${COUNTER}"

# Create R2 buckets
echo "Creating R2 buckets..."
wrangler r2 bucket create "storage-${TIMESTAMP}-${COUNTER}-staging"
wrangler r2 bucket create "storage-${TIMESTAMP}-${COUNTER}-prod"

# Create D1 databases
echo "Creating D1 databases..."
wrangler d1 create "database-${TIMESTAMP}-${COUNTER}-staging"
wrangler d1 create "database-${TIMESTAMP}-${COUNTER}-prod"

# Update wrangler.toml with new bindings
echo "Updating wrangler.toml configurations..."
cat > wrangler.toml << EOL
name = "worker"

[vars]
ENVIRONMENT = "staging"

[[r2_buckets]]
binding = 'STORAGE'
bucket_name = "storage-${TIMESTAMP}-${COUNTER}-staging"
preview_bucket_name = "storage-${TIMESTAMP}-${COUNTER}-staging"

[[d1_databases]]
binding = "DB"
database_name = "database-${TIMESTAMP}-${COUNTER}-staging"
database_id = "$(wrangler d1 list | grep "database-${TIMESTAMP}-${COUNTER}-staging" | awk '{print $1}')"

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.r2_buckets]]
binding = 'STORAGE'
bucket_name = "storage-${TIMESTAMP}-${COUNTER}-prod"

[[env.production.d1_databases]]
binding = "DB"
database_name = "database-${TIMESTAMP}-${COUNTER}-prod"
database_id = "$(wrangler d1 list | grep "database-${TIMESTAMP}-${COUNTER}-prod" | awk '{print $1}')"
EOL

# Initialize D1 schema
echo "Initializing D1 schemas..."
if [ -f "schema.sql" ]; then
    wrangler d1 execute "database-${TIMESTAMP}-${COUNTER}-staging" --file=schema.sql
    wrangler d1 execute "database-${TIMESTAMP}-${COUNTER}-prod" --file=schema.sql
else
    echo "Warning: schema.sql not found. Skipping schema initialization."
fi

# Test infrastructure
echo "Testing infrastructure..."

# Test staging
echo "Testing staging environment..."
wrangler dev --test &
DEV_PID=$!
sleep 5
curl -s http://localhost:8787/health || echo "Staging health check failed"
kill $DEV_PID

# Test production
echo "Testing production environment..."
wrangler dev --env production --test &
PROD_PID=$!
sleep 5
curl -s http://localhost:8787/health || echo "Production health check failed"
kill $PROD_PID

echo "Setup complete! New resources created with ID: ${TIMESTAMP}-${COUNTER}"
echo "Please verify all tests passed before deploying."