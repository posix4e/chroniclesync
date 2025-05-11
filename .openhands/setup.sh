#!/bin/bash
# OpenHands setup script for ChronicleSync P2P Playwright tests
# This script sets up the environment for running the Playwright tests

set -e # Exit on error

echo "🔧 Setting up ChronicleSync P2P Playwright tests environment..."

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps chromium

# Build the application
echo "🏗️ Building the application..."
npm run build

# Create test directories if they don't exist
echo "📁 Creating test directories..."
mkdir -p test-results
mkdir -p playwright-report

# Set up environment variables
echo "🔑 Setting up environment variables..."
export NODE_ENV=test
export PLAYWRIGHT_BROWSERS_PATH=0

# Print setup information
echo "ℹ️ Setup Information:"
echo "- Node version: $(node -v)"
echo "- NPM version: $(npm -v)"
echo "- Playwright version: $(npx playwright -V)"

echo "✅ Setup complete! You can now run the tests with:"
echo "npm run test:e2e          # Run all tests"
echo "npm run test:connection   # Run connection tests"
echo "npm run test:sync         # Run data sync tests"
echo "npm run test:conflict     # Run conflict resolution tests"
echo "npm run test:performance  # Run performance tests"
echo "npm run test:security     # Run security tests"
echo "npm run test:e2e:debug    # Run tests in debug mode"