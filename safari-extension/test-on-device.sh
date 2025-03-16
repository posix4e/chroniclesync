#!/bin/bash
set -e

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Build the Safari extension
echo "Building Safari extension..."
"$SCRIPT_DIR/build-safari-extension.sh"

# Get connected device UDID
echo "Getting connected device UDID..."
DEVICE_UDID=$(xcrun xctrace list devices | grep -v "Simulator" | grep -v "=" | head -1 | awk '{print $NF}' | tr -d '()')

if [ -z "$DEVICE_UDID" ]; then
  echo "No iOS device connected. Please connect an iOS device and try again."
  exit 1
fi

echo "Found device with UDID: $DEVICE_UDID"

# Build and run on device
echo "Building and running on device..."
# Note: For actual device builds, you'll need proper code signing
# You'll need to replace DEVELOPMENT_TEAM with your actual team ID
xcodebuild -project "$SCRIPT_DIR/ChronicleSync.xcodeproj" -scheme "ChronicleSync" -destination "id=$DEVICE_UDID" build DEVELOPMENT_TEAM="YOUR_TEAM_ID"

echo "App built successfully!"
echo ""
echo "To test the extension:"
echo "1. Open the ChronicleSync app on your device"
echo "2. Tap the 'Enable Extension' button"
echo "3. Open Safari and browse to a website"
echo "4. Tap the 'Aa' button in the address bar"
echo "5. Select 'ChronicleSync Extension' from the list"
echo ""
echo "The extension should now be active in Safari."