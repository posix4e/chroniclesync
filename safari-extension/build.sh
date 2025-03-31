#!/bin/bash

# Build script for ChronicleSync Safari Extension

echo "Building ChronicleSync Safari Extension..."
echo "This process may take several minutes as it needs to install dependencies and build the extension."

# Step 1: Build the extension files
echo "Step 1/3: Building extension files..."
node build-safari-extension.js
if [ $? -ne 0 ]; then
    echo "Error: Failed to build extension files. See error messages above."
    exit 1
fi

# Step 2: Modify JS files to use Safari API adapter
echo "Step 2/3: Modifying JS files to use Safari API adapter..."
node modify-js-files.js
if [ $? -ne 0 ]; then
    echo "Error: Failed to modify JS files. See error messages above."
    exit 1
fi

# Step 3: Create a zip file for easy import into Xcode
echo "Step 3/3: Creating zip file for Xcode import..."
if [ -d "ChronicleSync" ]; then
    cd ChronicleSync
    zip -r ../ChronicleSync-Safari-Extension.zip ./*
    cd ..
    echo "Build complete! ChronicleSync-Safari-Extension.zip is ready for import into Xcode."
else
    echo "Error: ChronicleSync directory not found. Build may have failed."
    exit 1
fi

echo ""
echo "Next steps for iOS Safari Extension:"
echo "1. Create a new Safari Extension App project in Xcode"
echo "2. Import the files from ChronicleSync-Safari-Extension.zip"
echo "3. Configure the extension in Xcode and build for iOS"
echo ""
echo "Documentation:"
echo "- README.md: General instructions"
echo "- XCODE_GUIDE.md: Detailed Xcode setup guide"
echo "- CHROME_VS_SAFARI.md: Key differences between Chrome and Safari extensions"
echo ""
echo "Note: Some Chrome APIs are not available in Safari on iOS."
echo "See CHROME_VS_SAFARI.md for details and workarounds."