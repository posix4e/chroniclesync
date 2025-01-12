#!/bin/bash
set -e

# Enable debug output
set -x

echo "Starting Safari extension build process..."

# Ensure we're in the pages directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Clean and create build directories
echo "Preparing build directories..."
mkdir -p dist/safari-app
rm -rf dist/safari-app/*

# Verify Safari extension source exists
if [ ! -d "dist/safari" ]; then
    echo "Error: Safari extension source directory not found!"
    echo "Current directory contents:"
    ls -la dist/
    exit 1
fi

# Convert web extension to Safari extension
echo "Converting web extension to Safari extension..."
xcrun safari-web-extension-converter dist/safari \
    --project-location dist/safari-app \
    --bundle-identifier dev.all-hands.chroniclesync \
    --no-prompt \
    --swift \
    --macos

# Find the Xcode project
echo "Looking for Xcode project..."
XCODE_PROJECT=$(find dist/safari-app -name "*.xcodeproj" -type d | head -n 1)
if [ -z "$XCODE_PROJECT" ]; then
    echo "Error: No Xcode project found!"
    echo "Contents of dist/safari-app:"
    ls -la dist/safari-app/
    exit 1
fi

# Get project directory and name
PROJECT_DIR=$(dirname "$XCODE_PROJECT")
PROJECT_NAME=$(basename "$PROJECT_DIR")
echo "Found project: $PROJECT_NAME in $PROJECT_DIR"

# Build the project
echo "Building Safari extension..."
cd "$PROJECT_DIR"
xcodebuild -project "$PROJECT_NAME.xcodeproj" \
    -scheme "$PROJECT_NAME" \
    -configuration Release \
    -verbose

# Find and package the app
echo "Looking for built app..."
APP_PATH=$(find . -name "*.app" -type d | head -n 1)
if [ -z "$APP_PATH" ]; then
    echo "Error: Built app not found!"
    echo "Contents of build directory:"
    find . -type d
    exit 1
fi

echo "Creating zip archive..."
cd ..
zip -r ../chroniclesync-safari.zip "$PROJECT_NAME/build/Release/$PROJECT_NAME.app"

echo "Safari extension build complete!"
ls -la ../chroniclesync-safari.zip