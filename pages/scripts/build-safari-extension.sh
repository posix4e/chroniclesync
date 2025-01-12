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

# Prepare Safari extension source
echo "Preparing Safari extension source..."
if [ ! -f "dist/safari/manifest.json" ]; then
    echo "Error: manifest.json not found in dist/safari!"
    ls -la dist/safari/
    exit 1
fi

# Ensure all required files are present
required_files=("manifest.json" "background.js" "popup.js" "popup.html")
for file in "${required_files[@]}"; do
    if [ ! -f "dist/safari/$file" ]; then
        echo "Error: Required file $file is missing!"
        exit 1
    fi
done

# Ensure icons directory exists with all required icons
if [ ! -d "dist/safari/icons" ]; then
    echo "Error: icons directory not found!"
    exit 1
fi

for size in 16 48 128; do
    if [ ! -f "dist/safari/icons/icon${size}.png" ]; then
        echo "Error: icon${size}.png is missing!"
        exit 1
    fi
done

echo "Safari extension source files:"
ls -la dist/safari/
echo "Icons:"
ls -la dist/safari/icons/

# Convert web extension to Safari extension
echo "Converting web extension to Safari extension..."
SAFARI_SRC="$(pwd)/dist/safari"
SAFARI_APP="$(pwd)/dist/safari-app"

# Verify manifest version
echo "Verifying manifest version..."
MANIFEST_VERSION=$(jq -r '.manifest_version' "$SAFARI_SRC/manifest.json")
if [ "$MANIFEST_VERSION" != "2" ]; then
    echo "Converting manifest to v2..."
    jq '.manifest_version = 2 | 
        if .action then .browser_action = .action | del(.action) else . end |
        if .background.service_worker then .background.scripts = [.background.service_worker] | del(.background.service_worker) else . end |
        if .host_permissions then .permissions = (.permissions + .host_permissions) | del(.host_permissions) else . end' \
        "$SAFARI_SRC/manifest.json" > "$SAFARI_SRC/manifest.json.tmp" && mv "$SAFARI_SRC/manifest.json.tmp" "$SAFARI_SRC/manifest.json"
fi

echo "Verified manifest version 2:"
jq '.' "$SAFARI_SRC/manifest.json"

echo "Current directory: $(pwd)"
echo "Safari source path: $SAFARI_SRC"
echo "Safari app path: $SAFARI_APP"
echo "Verifying source directory contents:"
ls -la "$SAFARI_SRC"

echo "Manifest content:"
cat "$SAFARI_SRC/manifest.json"

# Check Xcode and developer tools setup
echo "Checking Xcode setup..."
XCODE_PATH=$(xcode-select -p)
echo "Xcode path: $XCODE_PATH"

# List available developer tools
echo "Available developer tools:"
ls -la "$XCODE_PATH/usr/bin/"

# Try to find safari-web-extension-converter in multiple locations
POSSIBLE_PATHS=(
    "$XCODE_PATH/usr/bin/safari-web-extension-converter"
    "/Applications/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter"
    "/Library/Developer/CommandLineTools/usr/bin/safari-web-extension-converter"
)

CONVERTER_PATH=""
for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -x "$path" ]; then
        CONVERTER_PATH="$path"
        break
    fi
done

if [ -z "$CONVERTER_PATH" ]; then
    echo "Error: safari-web-extension-converter not found in any of these locations:"
    printf '%s\n' "${POSSIBLE_PATHS[@]}"
    echo "Trying xcrun as fallback..."
    CONVERTER_PATH=$(xcrun --find safari-web-extension-converter 2>/dev/null || true)
fi

if [ -z "$CONVERTER_PATH" ]; then
    echo "Error: Could not find safari-web-extension-converter"
    echo "Current PATH: $PATH"
    echo "Xcode version:"
    xcodebuild -version
    echo "Available SDKs:"
    xcodebuild -showsdks
    exit 1
fi

echo "Found safari-web-extension-converter at: $CONVERTER_PATH"

# Create a clean temporary directory with just the required files
TEMP_DIR="$(mktemp -d)"
echo "Creating temporary directory for Safari extension: $TEMP_DIR"

# Copy only the required files
echo "Copying files to temporary directory..."
for file in manifest.json background.js popup.html popup.js browser-polyfill.js; do
  echo "Copying $file..."
  if [ ! -f "$SAFARI_SRC/$file" ]; then
    echo "Error: Required file $file not found in $SAFARI_SRC"
    ls -la "$SAFARI_SRC"
    exit 1
  fi
  cp "$SAFARI_SRC/$file" "$TEMP_DIR/"
done

echo "Copying icons..."
mkdir -p "$TEMP_DIR/icons"
if [ ! -d "$SAFARI_SRC/icons" ]; then
  echo "Error: Icons directory not found in $SAFARI_SRC"
  ls -la "$SAFARI_SRC"
  exit 1
fi

for size in 16 48 128; do
  if [ ! -f "$SAFARI_SRC/icons/icon${size}.png" ]; then
    echo "Error: Required icon icon${size}.png not found in $SAFARI_SRC/icons"
    ls -la "$SAFARI_SRC/icons"
    exit 1
  fi
  cp "$SAFARI_SRC/icons/icon${size}.png" "$TEMP_DIR/icons/"
done

# Ensure manifest is v2 for Safari
echo "Verifying and fixing manifest version..."
jq '.manifest_version = 2 | 
    if .action then .browser_action = .action | del(.action) else . end |
    if .background.service_worker then .background.scripts = [.background.service_worker] | del(.background.service_worker) else . end |
    if .host_permissions then .permissions = (.permissions + .host_permissions) | del(.host_permissions) else . end' \
    "$TEMP_DIR/manifest.json" > "$TEMP_DIR/manifest.json.tmp" && mv "$TEMP_DIR/manifest.json.tmp" "$TEMP_DIR/manifest.json"

echo "Final manifest content:"
cat "$TEMP_DIR/manifest.json"

echo "Contents of temporary directory:"
ls -la "$TEMP_DIR"
ls -la "$TEMP_DIR/icons"

echo "Running safari-web-extension-converter..."
echo "Command: \"$CONVERTER_PATH\" \"$TEMP_DIR\" --project-location \"$SAFARI_APP\" --bundle-identifier dev.all-hands.chroniclesync --no-prompt --swift --macos --force"

# Print contents of all files for debugging
echo "Contents of manifest.json:"
cat "$TEMP_DIR/manifest.json"
echo "Contents of background.js:"
cat "$TEMP_DIR/background.js"
echo "Contents of popup.js:"
cat "$TEMP_DIR/popup.js"
echo "Contents of browser-polyfill.js:"
cat "$TEMP_DIR/browser-polyfill.js"

# Cleanup function
cleanup() {
    echo "Cleaning up temporary directory..."
    rm -rf "$TEMP_DIR"
}

# Set up trap to clean up on script exit
trap cleanup EXIT

# Try running the converter directly first
echo "Running converter with direct path..."
if ! "$CONVERTER_PATH" "$TEMP_DIR" \
    --project-location "$SAFARI_APP" \
    --bundle-identifier dev.all-hands.chroniclesync \
    --no-prompt \
    --swift \
    --macos \
    --force; then
    echo "Direct converter execution failed, trying with xcrun..."
    if ! xcrun safari-web-extension-converter "$TEMP_DIR" \
        --project-location "$SAFARI_APP" \
        --bundle-identifier dev.all-hands.chroniclesync \
        --no-prompt \
        --swift \
        --macos \
        --force; then
        echo "Both converter attempts failed. Checking environment:"
        echo "PATH: $PATH"
        echo "XCODE_PATH: $XCODE_PATH"
        echo "CONVERTER_PATH: $CONVERTER_PATH"
        echo "TEMP_DIR contents:"
        ls -la "$TEMP_DIR"
        echo "SAFARI_APP contents:"
        ls -la "$SAFARI_APP"
        exit 1
    fi
fi

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
echo "Current directory: $(pwd)"
echo "Project name: $PROJECT_NAME"
echo "Project files:"
ls -la

if [ ! -f "$PROJECT_NAME.xcodeproj/project.pbxproj" ]; then
    echo "Error: Project file not found: $PROJECT_NAME.xcodeproj/project.pbxproj"
    echo "Contents of current directory:"
    ls -la
    echo "Contents of .xcodeproj directory:"
    ls -la "$PROJECT_NAME.xcodeproj" || true
    exit 1
fi

echo "Building with xcodebuild..."
echo "Available schemes:"
xcodebuild -list -project "$PROJECT_NAME.xcodeproj" || true

echo "Available SDKs:"
xcodebuild -showsdks || true

echo "Building project..."
if ! xcodebuild -project "$PROJECT_NAME.xcodeproj" \
    -scheme "$PROJECT_NAME" \
    -configuration Release \
    -sdk macosx \
    -verbose \
    MACOSX_DEPLOYMENT_TARGET=10.15 \
    CODE_SIGN_IDENTITY="-" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO; then
    echo "xcodebuild failed. Checking build directory:"
    ls -la build/Release || true
    echo "Checking available schemes:"
    xcodebuild -list -project "$PROJECT_NAME.xcodeproj" || true
    echo "Checking build logs:"
    find ~/Library/Developer/Xcode/DerivedData -name "*.log" -type f -exec tail -n 100 {} \;
    exit 1
fi

# Find and package the app
echo "Looking for built app..."
APP_PATH=$(find . -name "*.app" -type d | head -n 1)
if [ -z "$APP_PATH" ]; then
    echo "Error: Built app not found!"
    echo "Contents of build directory:"
    find . -type d
    echo "Contents of Release directory:"
    ls -la build/Release || true
    echo "Contents of Debug directory:"
    ls -la build/Debug || true
    exit 1
fi

echo "Found app at: $APP_PATH"
echo "App contents:"
ls -la "$APP_PATH"

echo "Creating zip archive..."
cd ..
FULL_APP_PATH="$PROJECT_NAME/build/Release/$PROJECT_NAME.app"
if [ ! -d "$FULL_APP_PATH" ]; then
    echo "Error: App not found at expected path: $FULL_APP_PATH"
    echo "Available paths:"
    find "$PROJECT_NAME/build" -type d
    exit 1
fi

echo "Creating zip archive from: $FULL_APP_PATH"
if ! ditto -c -k --sequesterRsrc --keepParent "$FULL_APP_PATH" ../chroniclesync-safari.zip; then
    echo "Error: Failed to create zip archive with ditto"
    echo "Checking ditto command:"
    which ditto
    echo "Checking source directory:"
    ls -la "$FULL_APP_PATH"
    echo "Checking target directory:"
    ls -la ..
    echo "Trying zip command as fallback..."
    if ! zip -r ../chroniclesync-safari.zip "$FULL_APP_PATH"; then
        echo "Error: Both ditto and zip failed"
        echo "Checking zip command:"
        which zip
        exit 1
    fi
fi

echo "Safari extension build complete!"
ls -la ../chroniclesync-safari.zip