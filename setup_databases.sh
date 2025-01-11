#!/bin/bash

# Database IDs
STAGING_DB_ID="c353cc76-f5cd-41d0-bd9a-9b4629ab4d14"
PRODUCTION_DB_ID="00e393b1-4339-4fcf-9612-8ae11274ff3d"

# Generate wrangler.toml from template
echo "Generating wrangler.toml from template..."
sed -e "s/{{STAGING_DB_ID}}/$STAGING_DB_ID/g" \
    -e "s/{{PRODUCTION_DB_ID}}/$PRODUCTION_DB_ID/g" \
    wrangler.template.toml > worker/wrangler.toml

echo "Setting up tables in staging database..." 
npx wrangler d1 execute staging --config wrangler.setup.toml --file=setup_tables.sql --remote

echo "Setting up tables in production database..."
npx wrangler d1 execute production --config wrangler.setup.toml --file=setup_tables.sql --remote

echo "Done! Tables have been created in both databases and wrangler.toml has been generated."
