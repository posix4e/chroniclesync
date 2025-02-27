#!/bin/bash
set -e

# Install dependencies
npm install

# Build the extension
npm run build:extension

echo "Extension built successfully!"