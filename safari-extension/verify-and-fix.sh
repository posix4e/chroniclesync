#!/bin/bash
set -e

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR/../extension"
SAFARI_EXTENSION_DIR="$SCRIPT_DIR/ChronicleSync Extension/Resources"

# Print header
echo "===== ChronicleSync Safari Extension Verification Tool ====="
echo "This script will verify and fix common issues with the Safari extension."
echo ""

# Check if extension directory exists
if [ ! -d "$EXTENSION_DIR" ]; then
  echo "❌ ERROR: Extension directory not found at $EXTENSION_DIR"
  exit 1
else
  echo "✅ Extension directory found at $EXTENSION_DIR"
fi

# Check if Safari extension directory exists
if [ ! -d "$SAFARI_EXTENSION_DIR" ]; then
  echo "❌ Safari extension Resources directory not found at $SAFARI_EXTENSION_DIR"
  echo "Creating directory..."
  mkdir -p "$SAFARI_EXTENSION_DIR"
  echo "✅ Created Safari extension Resources directory"
else
  echo "✅ Safari extension Resources directory found at $SAFARI_EXTENSION_DIR"
fi

# Check if node_modules exists
if [ ! -d "$EXTENSION_DIR/node_modules" ]; then
  echo "❌ node_modules not found in extension directory"
  echo "Installing dependencies..."
  cd "$EXTENSION_DIR"
  npm install
  echo "✅ Dependencies installed"
else
  echo "✅ node_modules found in extension directory"
fi

# Check if extension is built
if [ ! -d "$EXTENSION_DIR/dist" ]; then
  echo "❌ dist directory not found in extension directory"
  echo "Building extension..."
  cd "$EXTENSION_DIR"
  npm run build
  echo "✅ Extension built"
else
  echo "✅ dist directory found in extension directory"
fi

# Check if manifest.json exists in Safari extension
if [ ! -f "$SAFARI_EXTENSION_DIR/manifest.json" ]; then
  echo "❌ manifest.json not found in Safari extension Resources directory"
  echo "Copying manifest.json from template..."
  cp "$SCRIPT_DIR/ChronicleSync Extension/Resources/manifest.json" "$SAFARI_EXTENSION_DIR/manifest.json" 2>/dev/null || {
    echo "Creating manifest.json..."
    cat > "$SAFARI_EXTENSION_DIR/manifest.json" << EOL
{
  "manifest_version": 3,
  "name": "ChronicleSync Extension",
  "version": "1.0",
  "description": "ChronicleSync Safari Extension",
  "devtools_page": "devtools.html",
  "action": {
    "default_popup": "popup.html"
  },
  "options_ui": {
    "page": "settings.html",
    "open_in_tab": true
  },
  "web_accessible_resources": [{
    "resources": ["history.html"],
    "matches": ["<all_urls>"]
  }],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "run_at": "document_idle"
    }
  ],
  "permissions": [
    "activeTab",
    "scripting",
    "tabs",
    "history",
    "storage",
    "unlimitedStorage"
  ],
  "host_permissions": [
    "http://localhost:*/*",
    "https://api.chroniclesync.xyz/*",
    "https://api-staging.chroniclesync.xyz/*"
  ]
}
EOL
  }
  echo "✅ manifest.json created"
else
  echo "✅ manifest.json found in Safari extension Resources directory"
fi

# Function to copy file with error handling
copy_file() {
  local src="$1"
  local dest="$2"
  
  if [ ! -f "$src" ]; then
    echo "❌ Source file not found: $src"
    return 1
  fi
  
  if ! cp "$src" "$dest"; then
    echo "❌ Failed to copy $src to $dest"
    return 1
  fi
  
  echo "✅ Copied $src to $dest"
  return 0
}

# Copy HTML files
echo ""
echo "Copying HTML files..."
copy_file "$EXTENSION_DIR/popup.html" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy popup.html"
copy_file "$EXTENSION_DIR/settings.html" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy settings.html"
copy_file "$EXTENSION_DIR/history.html" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy history.html"
copy_file "$EXTENSION_DIR/devtools.html" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy devtools.html"

# Copy CSS files
echo ""
echo "Copying CSS files..."
copy_file "$EXTENSION_DIR/popup.css" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy popup.css"
copy_file "$EXTENSION_DIR/settings.css" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy settings.css"
copy_file "$EXTENSION_DIR/history.css" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy history.css"
copy_file "$EXTENSION_DIR/devtools.css" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy devtools.css"

# Copy JS files
echo ""
echo "Copying JS files..."
copy_file "$EXTENSION_DIR/dist/popup.js" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy popup.js"
copy_file "$EXTENSION_DIR/dist/background.js" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy background.js"
copy_file "$EXTENSION_DIR/dist/settings.js" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy settings.js"
copy_file "$EXTENSION_DIR/dist/history.js" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy history.js"
copy_file "$EXTENSION_DIR/dist/devtools.js" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy devtools.js"
copy_file "$EXTENSION_DIR/dist/devtools-page.js" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy devtools-page.js"
copy_file "$EXTENSION_DIR/dist/content-script.js" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy content-script.js"
copy_file "$EXTENSION_DIR/bip39-wordlist.js" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy bip39-wordlist.js"

# Copy any additional JS files that might be needed
if [ -f "$EXTENSION_DIR/dist/options.js" ]; then
  copy_file "$EXTENSION_DIR/dist/options.js" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy options.js"
fi

if [ -f "$EXTENSION_DIR/dist/shared.js" ]; then
  copy_file "$EXTENSION_DIR/dist/shared.js" "$SAFARI_EXTENSION_DIR/" || echo "⚠️ Warning: Failed to copy shared.js"
fi

# Copy assets directory if it exists
if [ -d "$EXTENSION_DIR/dist/assets" ]; then
  echo ""
  echo "Copying assets directory..."
  mkdir -p "$SAFARI_EXTENSION_DIR/assets"
  if ! cp -R "$EXTENSION_DIR/dist/assets/"* "$SAFARI_EXTENSION_DIR/assets/" 2>/dev/null; then
    echo "⚠️ Warning: Failed to copy some assets files"
  else
    echo "✅ Copied assets directory"
  fi
fi

# Verify that essential files exist in the destination
echo ""
echo "Verifying essential files..."
essential_files=(
  "popup.html"
  "background.js"
  "content-script.js"
  "manifest.json"
)

missing_files=0
for file in "${essential_files[@]}"; do
  if [ ! -f "$SAFARI_EXTENSION_DIR/$file" ]; then
    echo "❌ Essential file missing in Safari extension: $file"
    missing_files=$((missing_files + 1))
  else
    echo "✅ Essential file found: $file"
  fi
done

# Print summary
echo ""
echo "===== Verification Summary ====="
if [ $missing_files -gt 0 ]; then
  echo "⚠️ WARNING: $missing_files essential files are missing. The extension may not work correctly."
else
  echo "✅ All essential files are present."
fi

# List all files in the Safari extension Resources directory
echo ""
echo "Files in Safari extension Resources directory:"
ls -la "$SAFARI_EXTENSION_DIR"

# Check file permissions
echo ""
echo "File permissions:"
ls -l "$SAFARI_EXTENSION_DIR/manifest.json"

echo ""
echo "===== Next Steps ====="
echo "1. Open the Xcode project: open ChronicleSync.xcodeproj"
echo "2. Clean the build folder: Product > Clean Build Folder"
echo "3. Build and run the app in the simulator"
echo "4. If you still encounter issues, check the TROUBLESHOOTING.md file"