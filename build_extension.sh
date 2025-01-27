#!/bin/bash
set -e

# Navigate to pages directory
cd pages

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the extension
echo "Building extension..."
npm run build:extension

# Create extension/dist directory
echo "Creating extension/dist directory..."
mkdir -p ../extension/dist

# Copy built files
echo "Copying built files..."
cp -r dist/* ../extension/dist/

# Copy manifest
echo "Copying manifest..."
cp ../extension/manifest.json ../extension/dist/

echo "Extension built successfully!"
echo "You can now load the extension from: $(pwd)/../extension/dist"