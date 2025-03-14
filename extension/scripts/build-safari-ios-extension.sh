#!/bin/bash
set -e

# Define paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAFARI_DIR="${ROOT_DIR}/safari-ios"
RESOURCES_DIR="${SAFARI_DIR}/ChronicleSync Extension/Resources"

# Ensure the Resources directory exists
mkdir -p "${RESOURCES_DIR}"

# Build the extension first
echo "Building extension..."
cd "${ROOT_DIR}"
npm run build

# Copy extension files to Safari extension resources
echo "Copying extension files to Safari extension..."

# Copy manifest.json
cp "${ROOT_DIR}/manifest.json" "${RESOURCES_DIR}/"

# Copy HTML, CSS, and JS files
cp "${ROOT_DIR}/popup.html" "${RESOURCES_DIR}/"
cp "${ROOT_DIR}/popup.css" "${RESOURCES_DIR}/"
cp "${ROOT_DIR}/settings.html" "${RESOURCES_DIR}/"
cp "${ROOT_DIR}/settings.css" "${RESOURCES_DIR}/"
cp "${ROOT_DIR}/history.html" "${RESOURCES_DIR}/"
cp "${ROOT_DIR}/history.css" "${RESOURCES_DIR}/"

# Copy JS files from dist
cp "${ROOT_DIR}/dist/popup.js" "${RESOURCES_DIR}/"
cp "${ROOT_DIR}/dist/background.js" "${RESOURCES_DIR}/"
cp "${ROOT_DIR}/dist/settings.js" "${RESOURCES_DIR}/"
cp "${ROOT_DIR}/dist/history.js" "${RESOURCES_DIR}/"
cp "${ROOT_DIR}/dist/content-script.js" "${RESOURCES_DIR}/"

# Copy assets directory if it exists
if [ -d "${ROOT_DIR}/dist/assets" ]; then
  mkdir -p "${RESOURCES_DIR}/assets"
  cp -R "${ROOT_DIR}/dist/assets/"* "${RESOURCES_DIR}/assets/"
fi

# Create a zip file of the Safari extension for distribution
echo "Creating Safari iOS extension archive..."
cd "${SAFARI_DIR}"
zip -r "${ROOT_DIR}/safari-ios-extension.zip" ./*

echo "Safari iOS extension build completed: ${ROOT_DIR}/safari-ios-extension.zip"