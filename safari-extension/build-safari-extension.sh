#!/bin/bash
set -e

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR/../extension"
SAFARI_EXTENSION_DIR="$SCRIPT_DIR/ChronicleSync Extension/Resources"

# Check if extension directory exists
if [ ! -d "$EXTENSION_DIR" ]; then
  echo "Error: Extension directory not found at $EXTENSION_DIR"
  exit 1
fi

# Build the extension
echo "Building extension..."
cd "$EXTENSION_DIR"
if ! npm run build; then
  echo "Error: Failed to build extension"
  exit 1
fi

# Create Safari extension directory if it doesn't exist
mkdir -p "$SAFARI_EXTENSION_DIR"

# Copy necessary files
echo "Copying files to Safari extension..."

# Function to copy file with error handling
copy_file() {
  local src="$1"
  local dest="$2"
  
  if [ ! -f "$src" ]; then
    echo "Warning: Source file not found: $src"
    return 1
  fi
  
  if ! cp "$src" "$dest"; then
    echo "Error: Failed to copy $src to $dest"
    return 1
  fi
  
  return 0
}

# Copy the manifest.json (already created with Safari-specific modifications)
# Copy HTML files
copy_file "$EXTENSION_DIR/popup.html" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/settings.html" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/history.html" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/devtools.html" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."

# Copy CSS files
copy_file "$EXTENSION_DIR/popup.css" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/settings.css" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/history.css" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/devtools.css" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."

# Copy JS files
copy_file "$EXTENSION_DIR/dist/popup.js" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/dist/background.js" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/dist/settings.js" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/dist/history.js" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/dist/devtools.js" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/dist/devtools-page.js" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/dist/content-script.js" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
copy_file "$EXTENSION_DIR/bip39-wordlist.js" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."

# Copy any additional JS files that might be needed
if [ -f "$EXTENSION_DIR/dist/options.js" ]; then
  copy_file "$EXTENSION_DIR/dist/options.js" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
fi

if [ -f "$EXTENSION_DIR/dist/shared.js" ]; then
  copy_file "$EXTENSION_DIR/dist/shared.js" "$SAFARI_EXTENSION_DIR/" || echo "Continuing despite error..."
fi

# Copy assets directory if it exists
if [ -d "$EXTENSION_DIR/dist/assets" ]; then
  mkdir -p "$SAFARI_EXTENSION_DIR/assets"
  if ! cp -R "$EXTENSION_DIR/dist/assets/"* "$SAFARI_EXTENSION_DIR/assets/" 2>/dev/null; then
    echo "Warning: Failed to copy some assets files"
  fi
fi

# Verify that essential files exist in the destination
essential_files=(
  "popup.html"
  "background.js"
  "content-script.js"
  "manifest.json"
)

missing_files=0
for file in "${essential_files[@]}"; do
  if [ ! -f "$SAFARI_EXTENSION_DIR/$file" ]; then
    echo "Error: Essential file missing in Safari extension: $file"
    missing_files=$((missing_files + 1))
  fi
done

if [ $missing_files -gt 0 ]; then
  echo "Warning: $missing_files essential files are missing. The extension may not work correctly."
else
  echo "Safari extension build completed successfully!"
fi