#!/bin/bash

# Exit on any error
set -e

# Check if this script is being run by an AI assistant
if [ "$USER" = "openhands" ] || [[ "$(whoami)" == *"bot"* ]] || [[ "$(whoami)" == *"agent"* ]]; then
    echo "ERROR: This script must be run by a human operator who has already authenticated with 'wrangler login'"
    echo "For safety reasons, this script cannot be run by automated systems or AI assistants."
    exit 1
fi

# Check if wrangler is installed and logged in
if ! command -v wrangler &> /dev/null; then
    echo "ERROR: wrangler is not installed. Please install it first."
    exit 1
fi

# Generate unique identifier for resources
TIMESTAMP=$(date +%Y%m%d)
COUNTER=1
while true; do
    R2_BUCKET="chroniclesync-bucket-${TIMESTAMP}-${COUNTER}"
    D1_DB="chroniclesync-db-${TIMESTAMP}-${COUNTER}"
    
    # Check if R2 bucket exists
    if ! wrangler r2 bucket list | grep -q "${R2_BUCKET}"; then
        break
    fi
    COUNTER=$((COUNTER + 1))
done

echo "Creating R2 bucket: ${R2_BUCKET}"
wrangler r2 bucket create "${R2_BUCKET}"

echo "Creating D1 database: ${D1_DB}"
wrangler d1 create "${D1_DB}"

# Get the database ID from the creation output
DB_ID=$(wrangler d1 list | grep "${D1_DB}" | awk '{print $1}')

# Update wrangler.toml with new bindings
cat > ../wrangler.toml << EOL
name = "chroniclesync"
main = "src/index.js"
compatibility_date = "2023-01-01"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "${R2_BUCKET}"

[[d1_databases]]
binding = "DB"
database_name = "${D1_DB}"
database_id = "${DB_ID}"
EOL

echo "Setting up database schema..."
for schema_file in schemas/*.sql; do
    if [ -f "$schema_file" ]; then
        echo "Applying schema: $schema_file"
        wrangler d1 execute "${D1_DB}" --file="$schema_file"
    fi
done

echo "Testing infrastructure..."

# Test R2 bucket
echo "Testing R2 bucket access..."
TEST_FILE="test.txt"
echo "test content" > "$TEST_FILE"
if wrangler r2 object put "${R2_BUCKET}/${TEST_FILE}" --file="$TEST_FILE"; then
    echo "✓ R2 bucket write test passed"
    wrangler r2 object delete "${R2_BUCKET}/${TEST_FILE}"
    rm "$TEST_FILE"
else
    echo "✗ R2 bucket write test failed"
    exit 1
fi

# Test D1 database
echo "Testing D1 database access..."
if wrangler d1 execute "${D1_DB}" --command="SELECT 1;"; then
    echo "✓ D1 database query test passed"
else
    echo "✗ D1 database query test failed"
    exit 1
fi

echo "Setup completed successfully!"
echo "R2 Bucket: ${R2_BUCKET}"
echo "D1 Database: ${D1_DB}"
echo "D1 Database ID: ${DB_ID}"