#!/bin/bash
# Helper script to set up Safari iOS extension development environment

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo "Error: Safari iOS extension development requires macOS"
  exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
  echo "Error: Xcode is required for Safari iOS extension development"
  echo "Please install Xcode from the App Store"
  exit 1
fi

# Set up directory structure
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SAFARI_IOS_DIR="$ROOT_DIR/safari-ios"

# Build Safari extension package
echo "Building Safari extension package..."
cd "$ROOT_DIR" && npm run build:safari

# Create Safari iOS project directory
echo "Creating Safari iOS project directory..."
mkdir -p "$SAFARI_IOS_DIR/ChronicleSync"
mkdir -p "$SAFARI_IOS_DIR/ChronicleSync/AppDelegate"
mkdir -p "$SAFARI_IOS_DIR/ChronicleSync/Resources"
mkdir -p "$SAFARI_IOS_DIR/ChronicleSync/SafariWebExtension"

# Extract Safari extension package
echo "Extracting Safari extension package..."
unzip -o "$ROOT_DIR/safari-extension.zip" -d "$SAFARI_IOS_DIR/ChronicleSync/SafariWebExtension"

# Create Info.plist
cat > "$SAFARI_IOS_DIR/ChronicleSync/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>ChronicleSync</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>$(MACOSX_DEPLOYMENT_TARGET)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler</string>
    </dict>
</dict>
</plist>
EOF

# Create SafariWebExtensionHandler.swift
cat > "$SAFARI_IOS_DIR/ChronicleSync/SafariWebExtension/SafariWebExtensionHandler.swift" << EOF
import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@", message as! CVarArg)

        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response": "Message received" ] ]

        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
EOF

# Create AppDelegate.swift
cat > "$SAFARI_IOS_DIR/ChronicleSync/AppDelegate/AppDelegate.swift" << EOF
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}
EOF

# Create README with instructions
cat > "$SAFARI_IOS_DIR/README.md" << EOF
# ChronicleSync Safari iOS Extension

## Setup Instructions

1. Open Xcode and create a new project
2. Select "Safari Extension App" template
3. Name the project "ChronicleSync"
4. Replace the extension files with the contents of the 'ChronicleSync/SafariWebExtension' directory
5. Update the Info.plist file with the provided one
6. Build and run the project

## Development

For development and testing on iOS devices, you'll need to:

1. Have a valid Apple Developer account
2. Configure the app with your development team
3. Enable Safari Web Extension development in Safari settings on your iOS device
4. Build and deploy to your device through Xcode

## Testing on iOS

1. Connect your iOS device to your Mac
2. Select your device as the build target in Xcode
3. Build and run the app
4. Open Settings on your iOS device
5. Navigate to Safari > Extensions
6. Enable the ChronicleSync extension
7. Open Safari and test the extension

## Distribution

To distribute the extension:

1. Archive the project in Xcode
2. Upload to App Store Connect
3. Submit for review

For more details, see Apple's documentation on Safari Web Extensions:
https://developer.apple.com/documentation/safariservices/safari_web_extensions
EOF

echo "Safari iOS project setup complete!"
echo "Project directory: $SAFARI_IOS_DIR"
echo "See README.md for instructions on how to build and test the extension."