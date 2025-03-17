#!/bin/bash
# Setup script for ChronicleSync Safari Extension
set -e

# Print header
echo "===== ChronicleSync Safari Extension Setup ====="
echo "This script will help you set up the Safari extension on your macOS machine."
echo

# Check if running on macOS
if [ "$(uname)" != "Darwin" ]; then
    echo "Error: This script must be run on macOS."
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "Error: Xcode is not installed. Please install Xcode from the App Store."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm (usually comes with Node.js)."
    exit 1
fi

# Print environment information
echo "Environment Information:"
echo "macOS Version: $(sw_vers -productVersion)"
echo "Xcode Version: $(xcodebuild -version | head -n 1)"
echo "Node Version: $(node -v)"
echo "npm Version: $(npm -v)"
echo

# Ensure we're in the right directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if we're on the right branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "add-safari-extension" ]; then
    echo "Currently on branch: $CURRENT_BRANCH"
    read -p "Would you like to switch to the add-safari-extension branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout add-safari-extension
        echo "Switched to add-safari-extension branch."
    else
        echo "Continuing with current branch: $CURRENT_BRANCH"
    fi
else
    echo "Already on add-safari-extension branch."
fi

# Build the extension
echo
echo "Building the extension..."
cd extension
npm install
npm run build

# Open the Xcode project
echo
echo "Opening Xcode project..."
open safari/ChronicleSync/ChronicleSync.xcodeproj

# Print next steps
echo
echo "===== Next Steps ====="
echo "1. In Xcode, select the ChronicleSync project in the Project Navigator"
echo "2. Go to the Signing & Capabilities tab"
echo "3. Select your Apple Developer Team for both targets"
echo "4. Click the Run button to build and run the app"
echo "5. In the app, click 'Enable Extension' to enable it in Safari"
echo
echo "For more detailed instructions, see safari-extension-setup-guide.md"
echo "===== Setup Complete ====="