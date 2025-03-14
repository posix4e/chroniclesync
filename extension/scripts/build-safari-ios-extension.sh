#!/bin/bash
set -e

# Define paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="${ROOT_DIR}/package"
SAFARI_IOS_DIR="${ROOT_DIR}/safari-ios"
EXTENSION_FILES_DIR="${SAFARI_IOS_DIR}/ChronicleSync Extension/ExtensionFiles"

# Detect platform
PLATFORM="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
fi

echo "Detected platform: $PLATFORM"

# Check for required tools
if ! command -v zip &> /dev/null; then
    echo "Error: zip command not found. Please install it first."
    echo "On Ubuntu/Debian: sudo apt-get install zip"
    echo "On CentOS/RHEL: sudo yum install zip"
    exit 1
fi

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

# Create a package file based on platform
if [[ "$PLATFORM" == "macos" ]]; then
    echo "On macOS, you should use Xcode to build a proper IPA file."
    echo "This script will create a placeholder IPA for CI purposes only."
    echo "Creating Safari iOS extension IPA file (placeholder)..."
    cd "${ROOT_DIR}" && zip -r safari-ios-extension.ipa "${SAFARI_IOS_DIR}"
    echo "Safari iOS extension package created: safari-ios-extension.ipa"
    echo "NOTE: This is a placeholder IPA and not a properly signed iOS app."
    echo "To create a real IPA for TestFlight, use Xcode or the GitHub Actions workflow."
else
    echo "Creating Safari iOS extension package for CI purposes..."
    cd "${ROOT_DIR}" && zip -r safari-ios-extension.ipa "${SAFARI_IOS_DIR}"
    echo "Safari iOS extension package created: safari-ios-extension.ipa"
    echo ""
    echo "⚠️  IMPORTANT: This is NOT a real IPA file that can be installed on iOS devices."
    echo "This package is only for CI/CD purposes. A proper IPA file requires:"
    echo "  - Building on macOS with Xcode"
    echo "  - Code signing with valid Apple certificates"
    echo "  - Proper app packaging with correct structure"
    echo ""
    echo "For TestFlight deployment, the GitHub Actions workflow will handle this"
    echo "on a macOS runner with the proper certificates and provisioning profiles."
fi

# Clean up
rm -rf "${PACKAGE_DIR}"

echo "Build completed successfully!"