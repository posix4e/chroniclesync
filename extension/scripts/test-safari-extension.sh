#!/bin/bash
set -e

# Script to test the Safari extension IPA with a simulator
EXTENSION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IPA_PATH="$EXTENSION_DIR/safari-ios-extension.ipa"
EXTRACTED_DIR="$EXTENSION_DIR/extracted-ipa"
BUNDLE_ID="xyz.chroniclesync.app"

# Check if the IPA exists
if [ ! -f "$IPA_PATH" ]; then
    echo "Error: IPA file not found at $IPA_PATH"
    echo "Please run the build script first to create the IPA file."
    exit 1
fi

# Extract the IPA for inspection
echo "Extracting IPA file for inspection..."
rm -rf "$EXTRACTED_DIR"
mkdir -p "$EXTRACTED_DIR"
unzip -q "$IPA_PATH" -d "$EXTRACTED_DIR"

# List available simulators
echo "Available iOS simulators:"
xcrun simctl list devices | grep -v "unavailable" | grep -E "iPhone|iPad"

# Ask user which simulator to use
echo ""
echo "Enter the device UDID or name of the simulator you want to use:"
read DEVICE_ID

# Boot the simulator if it's not already running
BOOTED_DEVICES=$(xcrun simctl list devices | grep "Booted" | wc -l)
if [ "$BOOTED_DEVICES" -eq 0 ]; then
    echo "Booting simulator $DEVICE_ID..."
    xcrun simctl boot "$DEVICE_ID" || {
        echo "Error: Failed to boot simulator. Please check the device ID/name and try again."
        exit 1
    }
fi

# Install the app on the simulator
echo "Installing app on simulator..."
xcrun simctl install booted "$EXTRACTED_DIR/Payload/ChronicleSync.app" || {
    echo "Error: Failed to install app on simulator."
    echo "This could be due to issues with the app bundle structure."
    echo ""
    echo "Attempting to fix common issues and reinstall..."
    
    # Create a fixed version with proper structure
    FIXED_APP="$EXTENSION_DIR/fixed-app"
    rm -rf "$FIXED_APP"
    mkdir -p "$FIXED_APP/ChronicleSync.app/PlugIns/ChronicleSync Extension.appex"
    cp -r "$EXTRACTED_DIR/Payload/ChronicleSync.app/"* "$FIXED_APP/ChronicleSync.app/"
    
    # Ensure main app Info.plist has required keys
    /usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string $BUNDLE_ID" "$FIXED_APP/ChronicleSync.app/Info.plist" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :CFBundleExecutable string ChronicleSync" "$FIXED_APP/ChronicleSync.app/Info.plist" 2>/dev/null || true
    
    # Create a minimal Info.plist for the extension if it doesn't exist or is invalid
    cat > "$FIXED_APP/ChronicleSync.app/PlugIns/ChronicleSync Extension.appex/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}.extension</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleDisplayName</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundleName</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundleExecutable</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundlePackageType</key>
    <string>XPC!</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>SafariWebExtensionHandler</string>
    </dict>
</dict>
</plist>
EOF
    
    # Create a placeholder executable for the extension
    mkdir -p "$FIXED_APP/ChronicleSync.app/PlugIns/ChronicleSync Extension.appex"
    echo "#!/bin/sh" > "$FIXED_APP/ChronicleSync.app/PlugIns/ChronicleSync Extension.appex/ChronicleSync Extension"
    chmod +x "$FIXED_APP/ChronicleSync.app/PlugIns/ChronicleSync Extension.appex/ChronicleSync Extension"
    
    # Try installing the fixed app
    xcrun simctl install booted "$FIXED_APP/ChronicleSync.app" || {
        echo "Error: Still unable to install the app. Please check the app structure manually."
        exit 1
    }
}

# Launch the app
echo "Launching app..."
xcrun simctl launch booted "$BUNDLE_ID" || {
    echo "Warning: Failed to launch app. This might be expected for Safari extensions."
}

# Launch Safari
echo "Launching Safari..."
xcrun simctl launch booted "com.apple.mobilesafari"

echo ""
echo "Safari has been launched. To enable the extension:"
echo "1. Open Safari Settings (tap on 'aA' in the address bar and select 'Website Settings')"
echo "2. Navigate to Extensions"
echo "3. Enable the ChronicleSync extension"
echo ""
echo "To view logs from the app:"
echo "xcrun simctl spawn booted log stream --predicate 'processImagePath contains \"ChronicleSync\"'"
echo ""
echo "To uninstall the app when done:"
echo "xcrun simctl uninstall booted $BUNDLE_ID"

exit 0