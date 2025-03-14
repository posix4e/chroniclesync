#!/bin/bash

# Exit on error
set -e

# Build the web extension first
echo "Building web extension..."
cd ../extension
npm install
npm run build:extension

# Check if the safari-extension.zip was created
if [ ! -f "safari-extension.zip" ]; then
    echo "Error: safari-extension.zip was not created. Check the build process."
    exit 1
fi

echo "Safari extension package created successfully."
echo ""
echo "To build the iOS app and create an IPA file, you need to:"
echo "1. Open the Xcode project on a Mac:"
echo "   open ChronicleSync.xcodeproj"
echo ""
echo "2. Configure your Apple Developer account in Xcode"
echo ""
echo "3. Build the project for your iOS device or simulator"
echo ""
echo "4. To create an IPA for TestFlight:"
echo "   - Select Product > Archive in Xcode"
echo "   - Click 'Distribute App' in the Archives window"
echo "   - Select 'App Store Connect' and follow the prompts"
echo ""
echo "5. Upload the build to TestFlight in App Store Connect"
echo ""
echo "6. Add testers in App Store Connect"
echo ""
echo "7. Testers will need to:"
echo "   - Install the app from TestFlight"
echo "   - Open Settings > Safari > Extensions"
echo "   - Enable the ChronicleSync extension"