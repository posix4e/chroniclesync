#!/bin/bash

echo "Setting up tables in staging database..." 
npx wrangler d1 execute staging --config wrangler.setup.toml --file=setup_tables.sql --remote

echo "Setting up tables in production database..."
npx wrangler d1 execute production --config wrangler.setup.toml --file=setup_tables.sql --remote

echo "Done! Tables have been created in both databases."
