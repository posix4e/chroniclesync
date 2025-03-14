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

# Check if we're on Linux and display a clear message
if [[ "$PLATFORM" == "linux" ]]; then
    echo "⚠️  WARNING: Building a real iOS Safari extension IPA file on Linux is not possible."
    echo "This script will only prepare the extension files for CI purposes."
    echo "For actual iOS deployment, the build must be performed on macOS with Xcode."
    echo ""
    echo "Continuing with preparation of extension files only..."
    echo ""
fi

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

# Check if package directory exists and has files
if [ ! -d "${PACKAGE_DIR}" ] || [ -z "$(ls -A ${PACKAGE_DIR} 2>/dev/null)" ]; then
    echo "Warning: Package directory is empty or doesn't exist."
    echo "Creating package directory with extension files..."
    mkdir -p "${PACKAGE_DIR}"
    cp -R "${ROOT_DIR}/dist" "${PACKAGE_DIR}/"
    cp "${ROOT_DIR}/manifest.json" "${PACKAGE_DIR}/"
    cp "${ROOT_DIR}"/*.html "${PACKAGE_DIR}/" 2>/dev/null || true
    cp "${ROOT_DIR}"/*.css "${PACKAGE_DIR}/" 2>/dev/null || true
    cp "${ROOT_DIR}/bip39-wordlist.js" "${PACKAGE_DIR}/" 2>/dev/null || true
fi

# Copy extension files to Safari iOS extension directory
echo "Copying extension files to Safari iOS extension..."
rm -rf "${EXTENSION_FILES_DIR}"/* || true
mkdir -p "${EXTENSION_FILES_DIR}"

# Check if there are files to copy
if [ -d "${PACKAGE_DIR}" ] && [ "$(ls -A ${PACKAGE_DIR} 2>/dev/null)" ]; then
    cp -R "${PACKAGE_DIR}"/* "${EXTENSION_FILES_DIR}/"
else
    echo "Error: No extension files to copy. Package directory is empty."
    echo "Copying dist directory instead..."
    cp -R "${ROOT_DIR}/dist" "${EXTENSION_FILES_DIR}/"
    cp "${ROOT_DIR}/manifest.json" "${EXTENSION_FILES_DIR}/" 2>/dev/null || true
    cp "${ROOT_DIR}"/*.html "${EXTENSION_FILES_DIR}/" 2>/dev/null || true
    cp "${ROOT_DIR}"/*.css "${EXTENSION_FILES_DIR}/" 2>/dev/null || true
    cp "${ROOT_DIR}/bip39-wordlist.js" "${EXTENSION_FILES_DIR}/" 2>/dev/null || true
fi

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
    echo "Creating Safari iOS extension source package for reference only..."
    cd "${ROOT_DIR}" && zip -r safari-ios-extension-source.zip "${SAFARI_IOS_DIR}"
    echo "Safari iOS extension source package created: safari-ios-extension-source.zip"
    echo ""
    echo "⚠️  IMPORTANT: Building a real IPA file on Linux is NOT POSSIBLE."
    echo "The source package created is for reference only and cannot be installed on iOS devices."
    echo "For actual iOS deployment:"
    echo "  - Use the GitHub Actions workflow with macOS runners"
    echo "  - Or build manually on a Mac with Xcode"
    echo ""
    echo "The GitHub Actions workflow has been configured to handle iOS builds"
    echo "specifically on macOS runners with the proper certificates."
fi

# Clean up
rm -rf "${PACKAGE_DIR}"

echo "Build completed successfully!"