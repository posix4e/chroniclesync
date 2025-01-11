# Worker Infrastructure Setup

This directory contains the infrastructure setup for Cloudflare Workers with R2 and D1 bindings.

## ⚠️ IMPORTANT SAFEGUARDS ⚠️

The `setup.sh` script in this directory is designed to be run **MANUALLY BY HUMANS ONLY**. 

DO NOT:
- Run this script in CI/CD pipelines
- Automate this script
- Include this script in any automated deployment process
- Execute this script programmatically

The script includes safeguards to prevent automated execution, but these are not foolproof. Always follow these guidelines.

## Prerequisites

Before running the setup script:

1. Ensure you have wrangler CLI installed
2. Run `wrangler login` and complete the authentication process
3. Verify you're logged in with `wrangler whoami`

## What the Setup Script Does

The setup script:

1. Creates new timestamped R2 buckets for staging and production
   - Format: `storage-YYYYMMDD-N-[staging|prod]`
2. Creates new timestamped D1 databases for staging and production
   - Format: `database-YYYYMMDD-N-[staging|prod]`
3. Updates wrangler.toml with the new resource bindings
4. Initializes database schemas if schema.sql is present
5. Tests the infrastructure by running health checks

Each run creates NEW resources with unique timestamps, ensuring clean infrastructure for each deployment.

## Running the Setup Script

1. Make the script executable:
   ```bash
   chmod +x setup.sh
   ```

2. Run the script interactively:
   ```bash
   ./setup.sh
   ```

3. Verify all tests pass before proceeding with deployment

## Resource Naming

Resources are named using the format:
- `[storage|database]-YYYYMMDD-N-[staging|prod]`
  - YYYYMMDD: Current date
  - N: Counter (increments if resources already exist for today)
  - staging/prod: Environment identifier

## Post-Setup

After running the setup script:
1. Verify all resources were created successfully
2. Check the wrangler.toml configuration
3. Test both staging and production environments
4. Deploy your worker code

## Troubleshooting

If you encounter issues:
1. Ensure you're logged in to wrangler
2. Check for existing resources with similar names
3. Verify you have sufficient permissions
4. Check the Cloudflare dashboard for any quota limits