#!/bin/bash
set -e

# Script to build Safari extension for iOS Simulator
# Modified version that doesn't require Apple Developer credentials

# Configuration
EXTENSION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAFARI_DIR="$EXTENSION_DIR/safari"
PACKAGE_DIR="$EXTENSION_DIR/package"
SAFARI_PROJECT_DIR="$SAFARI_DIR/ChronicleSync"
SAFARI_PROJECT="$SAFARI_PROJECT_DIR/ChronicleSync.xcodeproj"
BUILD_DIR="$SAFARI_DIR/build/simulator"
IOS_APP_PATH="$BUILD_DIR/ChronicleSync.app"

# Default bundle identifier
BUNDLE_ID="xyz.chroniclesync.app"
EXTENSION_BUNDLE_ID="$BUNDLE_ID.extension"

# Ensure build directory exists
mkdir -p "$BUILD_DIR"

# Clean up any existing package directory
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Run the build for the extension files
echo "Building extension files..."
cd "$EXTENSION_DIR"
npm run build

# Copy necessary files to the Safari extension resources directory
echo "Copying files to Safari extension resources..."
RESOURCES_DIR="$SAFARI_PROJECT_DIR/ChronicleSync Extension/Resources"
mkdir -p "$RESOURCES_DIR/assets"

# Copy files from the existing extension
cp "$EXTENSION_DIR/popup.html" "$RESOURCES_DIR/" || echo "Warning: popup.html not found"
cp "$EXTENSION_DIR/popup.css" "$RESOURCES_DIR/" || echo "Warning: popup.css not found"
cp "$EXTENSION_DIR/settings.html" "$RESOURCES_DIR/" || echo "Warning: settings.html not found"
cp "$EXTENSION_DIR/settings.css" "$RESOURCES_DIR/" || echo "Warning: settings.css not found"
cp "$EXTENSION_DIR/history.html" "$RESOURCES_DIR/" || echo "Warning: history.html not found"
cp "$EXTENSION_DIR/history.css" "$RESOURCES_DIR/" || echo "Warning: history.css not found"
cp "$EXTENSION_DIR/devtools.html" "$RESOURCES_DIR/" || echo "Warning: devtools.html not found"
cp "$EXTENSION_DIR/devtools.css" "$RESOURCES_DIR/" || echo "Warning: devtools.css not found"
cp "$EXTENSION_DIR/bip39-wordlist.js" "$RESOURCES_DIR/" || echo "Warning: bip39-wordlist.js not found"
cp "$EXTENSION_DIR/dist/popup.js" "$RESOURCES_DIR/" || echo "Warning: popup.js not found"
cp "$EXTENSION_DIR/dist/background.js" "$RESOURCES_DIR/" || echo "Warning: background.js not found"
cp "$EXTENSION_DIR/dist/settings.js" "$RESOURCES_DIR/" || echo "Warning: settings.js not found"
cp "$EXTENSION_DIR/dist/history.js" "$RESOURCES_DIR/" || echo "Warning: history.js not found"
cp "$EXTENSION_DIR/dist/devtools.js" "$RESOURCES_DIR/" || echo "Warning: devtools.js not found"
cp "$EXTENSION_DIR/dist/devtools-page.js" "$RESOURCES_DIR/" || echo "Warning: devtools-page.js not found"
cp "$EXTENSION_DIR/dist/content-script.js" "$RESOURCES_DIR/" || echo "Warning: content-script.js not found"
cp -r "$EXTENSION_DIR/dist/assets/"* "$RESOURCES_DIR/assets/" 2>/dev/null || echo "Warning: assets not found"

# Create manifest.json if it doesn't exist in the resources directory
if [ ! -f "$RESOURCES_DIR/manifest.json" ]; then
    echo "Creating manifest.json..."
    cat > "$RESOURCES_DIR/manifest.json" << EOF
{
  "manifest_version": 3,
  "name": "ChronicleSync",
  "version": "1.0",
  "description": "Sync your browsing history across devices",
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": ["history", "storage", "tabs"],
  "host_permissions": ["<all_urls>"]
}
EOF
fi

# Build for iOS Simulator
echo "Building Safari extension for iOS Simulator..."
xcodebuild -project "$SAFARI_PROJECT" -scheme "ChronicleSync" -configuration Debug \
    -destination "generic/platform=iOS Simulator" -derivedDataPath "$BUILD_DIR" \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO \
    ENABLE_BITCODE=NO ENABLE_TESTABILITY=YES

# Find the built app
APP_PATH=$(find "$BUILD_DIR" -name "*.app" -type d | head -n 1)
if [ -z "$APP_PATH" ]; then
    echo "Error: Could not find built app"
    exit 1
fi

echo "App built at: $APP_PATH"

# Create an IPA file from the app bundle
echo "Creating IPA file for simulator..."
mkdir -p "$BUILD_DIR/Payload"
cp -R "$APP_PATH" "$BUILD_DIR/Payload/"
cd "$BUILD_DIR"
zip -r "ChronicleSync-Simulator.ipa" "Payload"
cp "ChronicleSync-Simulator.ipa" "$EXTENSION_DIR/safari-ios-simulator.ipa"

echo "Safari extension IPA for simulator created: $EXTENSION_DIR/safari-ios-simulator.ipa"

# Create a simple script to install the app on the simulator
cat > "$EXTENSION_DIR/install-on-simulator.sh" << EOF
#!/bin/bash
# Script to install the ChronicleSync app on an iOS Simulator

# List available simulators
echo "Available simulators:"
xcrun simctl list devices | grep -v "unavailable"
echo ""
echo "To boot a simulator, run: xcrun simctl boot [DEVICE_ID]"
echo "To install the app, run: xcrun simctl install booted $EXTENSION_DIR/safari-ios-simulator.ipa"
echo "To launch the app, run: xcrun simctl launch booted $BUNDLE_ID"
echo "To open Safari, run: xcrun simctl launch booted com.apple.mobilesafari"
EOF

chmod +x "$EXTENSION_DIR/install-on-simulator.sh"
echo "Created installation helper script: $EXTENSION_DIR/install-on-simulator.sh"