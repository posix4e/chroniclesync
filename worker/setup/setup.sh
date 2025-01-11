#!/bin/bash

# Exit on any error
set -e

# Check if this script is being run by an AI assistant
if [ "$USER" = "openhands" ] || [[ "$(whoami)" == *"bot"* ]] || [[ "$(whoami)" == *"agent"* ]]; then
    echo "ERROR: This script must be run by a human operator who has already authenticated with 'wrangler login'"
    echo "For safety reasons, this script cannot be run by automated systems or AI assistants."
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Check if logged in to wrangler
if ! wrangler whoami &> /dev/null; then
    echo "ERROR: Please run 'wrangler login' first"
    exit 1
fi

# Function to setup environment
setup_environment() {
    local ENV=$1
    local DOMAIN=$2
    
    echo "Setting up $ENV environment..."
    
    # Generate unique identifier for resources
    TIMESTAMP=$(date +%Y%m%d)
    COUNTER=1
    while true; do
        R2_BUCKET="chroniclesync-bucket-${ENV}-${TIMESTAMP}-${COUNTER}"
        D1_DB="chroniclesync-db-${ENV}-${TIMESTAMP}-${COUNTER}"
        
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

    # Get the database ID
    DB_ID=$(wrangler d1 list | grep "${D1_DB}" | awk '{print $1}')

    # Store environment config
    if [ "$ENV" = "production" ]; then
        PROD_R2_BUCKET="${R2_BUCKET}"
        PROD_D1_DB="${D1_DB}"
        PROD_DB_ID="${DB_ID}"
        PROD_DOMAIN="${DOMAIN}"
    else
        STAGING_R2_BUCKET="${R2_BUCKET}"
        STAGING_D1_DB="${D1_DB}"
        STAGING_DB_ID="${DB_ID}"
        STAGING_DOMAIN="${DOMAIN}"
    fi

    # Update wrangler.toml after both environments are set up
    if [ "$ENV" = "staging" ]; then
        cat > ../wrangler.toml << EOL
name = "chroniclesync-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

[observability.logs]
enabled = true

[env.production]
routes = [
  { pattern = "${PROD_DOMAIN}", custom_domain = true }
]

[[env.production.d1_databases]]
binding = "DB"
database_name = "${PROD_D1_DB}"
database_id = "${PROD_DB_ID}"

[[env.production.r2_buckets]]
binding = "STORAGE"
bucket_name = "${PROD_R2_BUCKET}"

[env.staging]
name = "chroniclesync-worker-staging"
routes = [
  { pattern = "${STAGING_DOMAIN}", custom_domain = true }
]

[[env.staging.d1_databases]]
binding = "DB"
database_name = "${STAGING_D1_DB}"
database_id = "${STAGING_DB_ID}"

[[env.staging.r2_buckets]]
binding = "STORAGE"
bucket_name = "${STAGING_R2_BUCKET}"
EOL
    fi

    echo "Setting up database schema for ${ENV}..."
    for schema_file in schemas/*.sql; do
        if [ -f "$schema_file" ]; then
            echo "Applying schema: $schema_file"
            wrangler d1 execute "${D1_DB}" --file="$schema_file" --env="${ENV}"
        fi
    done

    echo "Testing ${ENV} infrastructure..."

    # Test R2 bucket
    echo "Testing R2 bucket access..."
    TEST_FILE="test.txt"
    echo "test content" > "$TEST_FILE"
    if wrangler r2 object put "${R2_BUCKET}/${TEST_FILE}" --file="$TEST_FILE" --env="${ENV}"; then
        echo "✓ R2 bucket write test passed"
        wrangler r2 object delete "${R2_BUCKET}/${TEST_FILE}" --env="${ENV}"
        rm "$TEST_FILE"
    else
        echo "✗ R2 bucket write test failed"
        exit 1
    fi

    # Test D1 database
    echo "Testing D1 database access..."
    if wrangler d1 execute "${D1_DB}" --command="SELECT 1;" --env="${ENV}"; then
        echo "✓ D1 database query test passed"
    else
        echo "✗ D1 database query test failed"
        exit 1
    fi

    # Deploy worker
    echo "Deploying worker for ${ENV}..."
    cd ../ && wrangler deploy --env="${ENV}"

    if [ "$ENV" = "staging" ]; then
        echo "Setup completed successfully!"
        echo "
Production Environment:
- Domain: ${PROD_DOMAIN}
- R2 Bucket: ${PROD_R2_BUCKET}
- D1 Database: ${PROD_D1_DB}
- D1 Database ID: ${PROD_DB_ID}

Staging Environment:
- Domain: ${STAGING_DOMAIN}
- R2 Bucket: ${STAGING_R2_BUCKET}
- D1 Database: ${STAGING_D1_DB}
- D1 Database ID: ${STAGING_DB_ID}

Next steps:
1. Test the deployments:
   - Production: https://${PROD_DOMAIN}
   - Staging: https://${STAGING_DOMAIN}
2. Save these credentials in a secure location
3. Update your application configuration to use these resources"
    fi
}

# Setup production environment
setup_environment "production" "api.chroniclesync.xyz"

# Setup staging environment
setup_environment "staging" "api-staging.chroniclesync.xyz"