#!/bin/bash
# create_safari_project.sh - Creates the basic Safari extension project structure
set -e

echo "Creating Safari extension project structure..."

# Create directories
mkdir -p safari/ChronicleSync
mkdir -p safari/Extension
mkdir -p safari/Extension/Resources

# Create basic Swift files for the container app
cat > safari/ChronicleSync/AppDelegate.swift << 'EOF'
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = ViewController()
        window?.makeKeyAndVisible()
        return true
    }
}
EOF

cat > safari/ChronicleSync/ViewController.swift << 'EOF'
import UIKit
import SafariServices

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        
        let titleLabel = UILabel()
        titleLabel.text = "ChronicleSync"
        titleLabel.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        
        let descriptionLabel = UILabel()
        descriptionLabel.text = "Safari Extension for syncing across browsers"
        descriptionLabel.font = UIFont.systemFont(ofSize: 16)
        descriptionLabel.translatesAutoresizingMaskIntoConstraints = false
        
        let enableButton = UIButton(type: .system)
        enableButton.setTitle("Enable Extension in Safari", for: .normal)
        enableButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
        enableButton.backgroundColor = .systemBlue
        enableButton.setTitleColor(.white, for: .normal)
        enableButton.layer.cornerRadius = 10
        enableButton.addTarget(self, action: #selector(openSafariSettings), for: .touchUpInside)
        enableButton.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(titleLabel)
        view.addSubview(descriptionLabel)
        view.addSubview(enableButton)
        
        NSLayoutConstraint.activate([
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 60),
            
            descriptionLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            descriptionLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 20),
            
            enableButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            enableButton.topAnchor.constraint(equalTo: descriptionLabel.bottomAnchor, constant: 40),
            enableButton.widthAnchor.constraint(equalToConstant: 250),
            enableButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }
    
    @objc func openSafariSettings() {
        // In simulator, this will just show an alert since we can't open Settings directly
        let alert = UIAlertController(
            title: "Enable Extension", 
            message: "To enable the extension, go to Settings > Safari > Extensions", 
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
EOF

# Create minimal Safari extension handler
cat > safari/Extension/SafariWebExtensionHandler.swift << 'EOF'
import SafariServices

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        
        // Simple echo response
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response": "Received" ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
EOF

# Create Info.plist files
cat > safari/ChronicleSync/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
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
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
EOF

cat > safari/Extension/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
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

# Create project.yml for xcodegen
cat > safari/project.yml << 'EOF'
name: ChronicleSync
options:
  bundleIdPrefix: com.chroniclesync
targets:
  ChronicleSync:
    type: application
    platform: iOS
    deploymentTarget: "14.0"
    sources: [ChronicleSync]
    info:
      path: ChronicleSync/Info.plist
      properties:
        CFBundleDisplayName: ChronicleSync
        UILaunchStoryboardName: LaunchScreen
    dependencies:
      - target: Extension
  Extension:
    type: app-extension
    platform: iOS
    deploymentTarget: "14.0"
    sources: [Extension]
    info:
      path: Extension/Info.plist
      properties:
        NSExtension:
          NSExtensionPointIdentifier: com.apple.Safari.web-extension
          NSExtensionPrincipalClass: $(PRODUCT_MODULE_NAME).SafariWebExtensionHandler
    dependencies: []
    settings:
      base:
        INFOPLIST_FILE: Extension/Info.plist
        PRODUCT_BUNDLE_IDENTIFIER: com.chroniclesync.extension
EOF

echo "Safari project structure created successfully!"