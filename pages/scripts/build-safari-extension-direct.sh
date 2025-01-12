#!/bin/bash
set -e

# Enable debug output
set -x

echo "Starting Safari extension direct build process..."

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

# Create Safari App Extension structure
SAFARI_APP="$(pwd)/dist/safari-app/ChronicleSync.app"
EXTENSION_DIR="$SAFARI_APP/Contents/PlugIns/ChronicleSync.appex"
RESOURCES_DIR="$EXTENSION_DIR/Contents/Resources"

mkdir -p "$SAFARI_APP/Contents/MacOS"
mkdir -p "$SAFARI_APP/Contents/Resources"
mkdir -p "$EXTENSION_DIR/Contents/MacOS"
mkdir -p "$RESOURCES_DIR"

# Copy extension files
echo "Copying extension files..."
cp -r dist/safari/* "$RESOURCES_DIR/"

# Create Info.plist for main app
cat > "$SAFARI_APP/Contents/Info.plist" << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>dev.all-hands.chroniclesync</string>
    <key>CFBundleName</key>
    <string>ChronicleSync</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOL

# Create Info.plist for extension
cat > "$EXTENSION_DIR/Contents/Info.plist" << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>dev.all-hands.chroniclesync.extension</string>
    <key>CFBundleName</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundlePackageType</key>
    <string>XPC!</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>SafariWebExtensionHandler</string>
    </dict>
</dict>
</plist>
EOL

# Create dummy executable for main app
cat > "$SAFARI_APP/Contents/MacOS/ChronicleSync" << 'EOL'
#!/bin/bash
open -a Safari
EOL
chmod +x "$SAFARI_APP/Contents/MacOS/ChronicleSync"

# Create dummy executable for extension
cat > "$EXTENSION_DIR/Contents/MacOS/ChronicleSync_Extension" << 'EOL'
#!/bin/bash
exit 0
EOL
chmod +x "$EXTENSION_DIR/Contents/MacOS/ChronicleSync_Extension"

# Package the app
echo "Packaging Safari extension..."
cd dist
ditto -c -k --keepParent safari-app/ChronicleSync.app ../chroniclesync-safari.zip

echo "✓ Safari extension built successfully"