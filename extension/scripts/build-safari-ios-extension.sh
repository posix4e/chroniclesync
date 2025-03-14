#!/bin/bash
set -e

# Define paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="${ROOT_DIR}/package"
SAFARI_IOS_DIR="${ROOT_DIR}/safari-ios"
EXTENSION_FILES_DIR="${SAFARI_IOS_DIR}/ChronicleSync Extension/ExtensionFiles"

# Clean up any existing package directory
rm -rf "${PACKAGE_DIR}" || true
mkdir -p "${PACKAGE_DIR}"

# Run the build
echo "Building extension..."
cd "${ROOT_DIR}" && npm run build

# Copy necessary files to package directory
echo "Copying files to package directory..."
node "${ROOT_DIR}/scripts/build-extension.cjs"

# Copy extension files to Safari iOS extension directory
echo "Copying extension files to Safari iOS extension..."
rm -rf "${EXTENSION_FILES_DIR}"/* || true
mkdir -p "${EXTENSION_FILES_DIR}"
cp -R "${PACKAGE_DIR}"/* "${EXTENSION_FILES_DIR}/"

# Create a dummy IPA file for demonstration purposes
# In a real environment, you would use Xcode to build the IPA
echo "Creating Safari iOS extension IPA file..."
cd "${ROOT_DIR}" && zip -r safari-ios-extension.ipa "${SAFARI_IOS_DIR}"

echo "Safari iOS extension package created: safari-ios-extension.ipa"

# Clean up
rm -rf "${PACKAGE_DIR}"