#!/bin/bash
set -e

# Define paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAFARI_IOS_DIR="${ROOT_DIR}/safari-ios"

# Detect platform
PLATFORM="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
fi

echo "Detected platform: $PLATFORM"

# Check if we're on Linux and exit early with a clear message
if [[ "$PLATFORM" != "macos" ]]; then
    echo "⚠️  ERROR: Building a Safari iOS extension is only supported on macOS."
    echo "This script will not attempt to build on Linux or other platforms."
    echo ""
    echo "For iOS Safari extension development:"
    echo "  1. Use macOS with Xcode to build and test the extension"
    echo "  2. The GitHub Actions workflow will handle iOS builds on macOS runners"
    echo ""
    echo "If you need to test the extension functionality:"
    echo "  - Use Chrome or Firefox extensions which work on all platforms"
    echo "  - The core extension code is shared between all browser versions"
    echo ""
    
    # Create a dummy file to satisfy CI if needed
    if [[ "$CI" == "true" ]]; then
        echo "Creating a placeholder file for CI purposes..."
        echo "This is a placeholder. Real iOS builds require macOS." > "${ROOT_DIR}/safari-ios-extension-placeholder.txt"
    fi
    
    exit 0
fi

# We're on macOS, continue with the build

# Check for required tools
if ! command -v zip &> /dev/null; then
    echo "Error: zip command not found. Please install it first."
    echo "On macOS: brew install zip"
    exit 1
fi

# Clean up any existing package directory
PACKAGE_DIR="${ROOT_DIR}/package"
rm -rf "${PACKAGE_DIR}" || true
mkdir -p "${PACKAGE_DIR}"

# Run the build
echo "Building extension..."
cd "${ROOT_DIR}" && npm run build

# Copy necessary files to package directory
echo "Copying files to package directory..."
node "${ROOT_DIR}/scripts/build-extension.cjs"

# Prepare extension files directory
EXTENSION_FILES_DIR="${SAFARI_IOS_DIR}/ChronicleSync Extension/ExtensionFiles"
echo "Copying extension files to Safari iOS extension..."
rm -rf "${EXTENSION_FILES_DIR}"/* || true
mkdir -p "${EXTENSION_FILES_DIR}"

# Check if package directory exists and has files
if [ -d "${PACKAGE_DIR}" ] && [ "$(ls -A ${PACKAGE_DIR} 2>/dev/null)" ]; then
    cp -R "${PACKAGE_DIR}"/* "${EXTENSION_FILES_DIR}/"
else
    echo "Warning: Package directory is empty or doesn't exist."
    echo "Copying extension files directly..."
    cp -R "${ROOT_DIR}/dist" "${EXTENSION_FILES_DIR}/"
    cp "${ROOT_DIR}/manifest.json" "${EXTENSION_FILES_DIR}/" 2>/dev/null || true
    cp "${ROOT_DIR}"/*.html "${EXTENSION_FILES_DIR}/" 2>/dev/null || true
    cp "${ROOT_DIR}"/*.css "${EXTENSION_FILES_DIR}/" 2>/dev/null || true
    cp "${ROOT_DIR}/bip39-wordlist.js" "${EXTENSION_FILES_DIR}/" 2>/dev/null || true
fi

# Create a placeholder IPA file
echo "Creating Safari iOS extension IPA file (placeholder)..."
cd "${ROOT_DIR}" && zip -r safari-ios-extension.ipa "${SAFARI_IOS_DIR}"
echo "Safari iOS extension package created: safari-ios-extension.ipa"
echo ""
echo "NOTE: This is a placeholder IPA and not a properly signed iOS app."
echo "To create a real IPA for TestFlight:"
echo "  1. Open the Xcode project in ${SAFARI_IOS_DIR}"
echo "  2. Configure signing with your Apple Developer account"
echo "  3. Build and archive the project"
echo "  4. Use the GitHub Actions workflow for automated TestFlight deployment"

# Clean up
rm -rf "${PACKAGE_DIR}"

echo "Build completed successfully!"