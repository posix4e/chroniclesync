#!/bin/bash
set -e

# Main script to create Safari extension app

echo "=== ChronicleSync Safari Extension Setup ==="
echo ""
echo "This script will create a Safari extension app based on the existing Chrome extension."
echo "Please make sure you have Xcode installed and are running this on macOS."
echo ""
echo "Before continuing, please update the TEAM_ID in create_safari_extension.sh with your Apple Developer Team ID."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Step 1: Create the Safari extension project structure
echo ""
echo "Step 1: Creating Safari extension project structure..."
./create_safari_extension.sh

# Step 2: Convert Chrome extension to Safari extension
echo ""
echo "Step 2: Converting Chrome extension to Safari extension..."
./convert_chrome_to_safari.sh

# Step 3: Generate Xcode project
echo ""
echo "Step 3: Generating Xcode project..."
cd ChronicleSync
xcodegen generate
cd ..

echo ""
echo "=== Setup Complete ==="
echo ""
echo "The Safari extension project has been created successfully!"
echo ""
echo "Next steps:"
echo "1. Open the Xcode project: open ChronicleSync/ChronicleSync.xcodeproj"
echo "2. Update the development team in Xcode if needed"
echo "3. Build and run the app on a device or simulator"
echo "4. Enable the extension in Safari settings"
echo ""
echo "For more detailed instructions, please refer to SAFARI_EXTENSION_IMPLEMENTATION_GUIDE.md"
echo ""

# Ask if the user wants to open the Xcode project
read -p "Would you like to open the Xcode project now? (y/n): " open_xcode
if [[ $open_xcode == "y" || $open_xcode == "Y" ]]; then
    open ChronicleSync/ChronicleSync.xcodeproj
fi