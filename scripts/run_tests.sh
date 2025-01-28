#!/bin/bash
set -e

# Run pages tests
echo "Running pages tests..."
cd pages
npm run test:e2e

# Run extension tests
echo "Running extension tests..."
cd ../extension
npm run test:e2e