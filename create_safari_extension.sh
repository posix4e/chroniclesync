#!/bin/bash
set -e

# Configuration
APP_NAME="ChronicleSync"
BUNDLE_ID="xyz.chroniclesync.safari"
ORGANIZATION_NAME="ChronicleSync"
ORGANIZATION_ID="xyz.chroniclesync"
TEAM_ID="YOUR_TEAM_ID" # Replace with your Apple Developer Team ID

# Create directory for the Safari extension project
mkdir -p SafariExtension

# Navigate to the directory
cd SafariExtension

# Create Xcode project with Safari App Extension
echo "Creating Xcode project for Safari Extension..."
xcrun swift package init --type executable

# Create Package.swift file
cat > Package.swift << EOL
// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "${APP_NAME}",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .executable(name: "${APP_NAME}", targets: ["${APP_NAME}"])
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "${APP_NAME}",
            dependencies: [
                .product(name: "ArgumentParser", package: "swift-argument-parser"),
            ]),
        .testTarget(
            name: "${APP_NAME}Tests",
            dependencies: ["${APP_NAME}"]),
    ]
)
EOL

# Create Xcode project
echo "Creating Xcode project structure..."
mkdir -p "${APP_NAME}.xcodeproj"

# Create a basic Swift file for the main app
mkdir -p Sources/${APP_NAME}
cat > Sources/${APP_NAME}/main.swift << EOL
import Foundation
import ArgumentParser

struct ${APP_NAME}: ParsableCommand {
    static var configuration = CommandConfiguration(
        abstract: "A utility for ${APP_NAME}."
    )
    
    func run() throws {
        print("${APP_NAME} is running!")
    }
}

${APP_NAME}.main()
EOL

# Now create the actual iOS app project with Safari extension
cd ..

# Create a new Xcode project for iOS with Safari Extension
echo "Creating iOS app with Safari Extension..."
mkdir -p ${APP_NAME}App

# Create project structure
mkdir -p ${APP_NAME}App/${APP_NAME}App
mkdir -p ${APP_NAME}App/${APP_NAME}Extension

# Create App Delegate
cat > ${APP_NAME}App/${APP_NAME}App/AppDelegate.swift << EOL
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }
}
EOL

# Create Main View Controller
cat > ${APP_NAME}App/${APP_NAME}App/ViewController.swift << EOL
import UIKit
import SafariServices

class ViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        let stackView = UIStackView()
        stackView.axis = .vertical
        stackView.spacing = 20
        stackView.alignment = .center
        stackView.translatesAutoresizingMaskIntoConstraints = false
        
        let titleLabel = UILabel()
        titleLabel.text = "ChronicleSync"
        titleLabel.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        
        let descriptionLabel = UILabel()
        descriptionLabel.text = "Safari Extension for ChronicleSync"
        descriptionLabel.font = UIFont.systemFont(ofSize: 16)
        descriptionLabel.textAlignment = .center
        descriptionLabel.numberOfLines = 0
        
        let settingsButton = UIButton(type: .system)
        settingsButton.setTitle("Open Settings", for: .normal)
        settingsButton.addTarget(self, action: #selector(openSettings), for: .touchUpInside)
        
        let safariButton = UIButton(type: .system)
        safariButton.setTitle("Enable in Safari", for: .normal)
        safariButton.addTarget(self, action: #selector(openSafariSettings), for: .touchUpInside)
        
        stackView.addArrangedSubview(titleLabel)
        stackView.addArrangedSubview(descriptionLabel)
        stackView.addArrangedSubview(settingsButton)
        stackView.addArrangedSubview(safariButton)
        
        view.addSubview(stackView)
        
        NSLayoutConstraint.activate([
            stackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stackView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stackView.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -20)
        ])
    }
    
    @objc private func openSettings() {
        let settingsVC = SettingsViewController()
        navigationController?.pushViewController(settingsVC, animated: true)
    }
    
    @objc private func openSafariSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}
EOL

# Create Settings View Controller
cat > ${APP_NAME}App/${APP_NAME}App/SettingsViewController.swift << EOL
import UIKit

class SettingsViewController: UIViewController {
    
    private let mnemonicTextView = UITextView()
    private let clientIdTextField = UITextField()
    private let environmentSegmentedControl = UISegmentedControl(items: ["Production", "Staging", "Custom"])
    private let customApiUrlTextField = UITextField()
    private let expirationDaysTextField = UITextField()
    private let saveButton = UIButton(type: .system)
    private let resetButton = UIButton(type: .system)
    
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Settings"
        view.backgroundColor = .systemBackground
        setupUI()
        loadSettings()
    }
    
    private func setupUI() {
        let scrollView = UIScrollView()
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scrollView)
        
        let contentView = UIView()
        contentView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(contentView)
        
        // Configure UI elements
        let stackView = UIStackView()
        stackView.axis = .vertical
        stackView.spacing = 20
        stackView.alignment = .fill
        stackView.translatesAutoresizingMaskIntoConstraints = false
        
        // Mnemonic section
        let mnemonicLabel = UILabel()
        mnemonicLabel.text = "Mnemonic Phrase:"
        
        mnemonicTextView.layer.borderWidth = 1
        mnemonicTextView.layer.borderColor = UIColor.systemGray4.cgColor
        mnemonicTextView.layer.cornerRadius = 5
        mnemonicTextView.font = UIFont.systemFont(ofSize: 16)
        mnemonicTextView.isSecureTextEntry = true
        mnemonicTextView.translatesAutoresizingMaskIntoConstraints = false
        mnemonicTextView.heightAnchor.constraint(equalToConstant: 100).isActive = true
        
        let mnemonicButtonsStack = UIStackView()
        mnemonicButtonsStack.axis = .horizontal
        mnemonicButtonsStack.spacing = 10
        mnemonicButtonsStack.distribution = .fillEqually
        
        let generateButton = UIButton(type: .system)
        generateButton.setTitle("Generate New", for: .normal)
        generateButton.addTarget(self, action: #selector(generateMnemonic), for: .touchUpInside)
        
        let showHideButton = UIButton(type: .system)
        showHideButton.setTitle("Show/Hide", for: .normal)
        showHideButton.addTarget(self, action: #selector(toggleMnemonicVisibility), for: .touchUpInside)
        
        mnemonicButtonsStack.addArrangedSubview(generateButton)
        mnemonicButtonsStack.addArrangedSubview(showHideButton)
        
        // Client ID section
        let clientIdLabel = UILabel()
        clientIdLabel.text = "Client ID:"
        
        clientIdTextField.placeholder = "Generated from mnemonic"
        clientIdTextField.isEnabled = false
        clientIdTextField.borderStyle = .roundedRect
        
        // Environment section
        let environmentLabel = UILabel()
        environmentLabel.text = "Environment:"
        
        environmentSegmentedControl.selectedSegmentIndex = 0
        environmentSegmentedControl.addTarget(self, action: #selector(environmentChanged), for: .valueChanged)
        
        // Custom API URL section
        let customApiUrlLabel = UILabel()
        customApiUrlLabel.text = "Custom API URL:"
        
        customApiUrlTextField.placeholder = "https://your-custom-api.com"
        customApiUrlTextField.borderStyle = .roundedRect
        customApiUrlTextField.isHidden = true
        customApiUrlLabel.isHidden = true
        
        // Expiration days section
        let expirationDaysLabel = UILabel()
        expirationDaysLabel.text = "History Expiration (Days):"
        
        expirationDaysTextField.placeholder = "7"
        expirationDaysTextField.borderStyle = .roundedRect
        expirationDaysTextField.keyboardType = .numberPad
        
        // Buttons
        let buttonsStack = UIStackView()
        buttonsStack.axis = .horizontal
        buttonsStack.spacing = 10
        buttonsStack.distribution = .fillEqually
        
        saveButton.setTitle("Save Settings", for: .normal)
        saveButton.backgroundColor = .systemBlue
        saveButton.setTitleColor(.white, for: .normal)
        saveButton.layer.cornerRadius = 5
        saveButton.addTarget(self, action: #selector(saveSettings), for: .touchUpInside)
        
        resetButton.setTitle("Reset to Default", for: .normal)
        resetButton.backgroundColor = .systemGray5
        resetButton.setTitleColor(.systemRed, for: .normal)
        resetButton.layer.cornerRadius = 5
        resetButton.addTarget(self, action: #selector(resetToDefault), for: .touchUpInside)
        
        buttonsStack.addArrangedSubview(saveButton)
        buttonsStack.addArrangedSubview(resetButton)
        
        // Add all elements to the stack view
        stackView.addArrangedSubview(mnemonicLabel)
        stackView.addArrangedSubview(mnemonicTextView)
        stackView.addArrangedSubview(mnemonicButtonsStack)
        stackView.addArrangedSubview(clientIdLabel)
        stackView.addArrangedSubview(clientIdTextField)
        stackView.addArrangedSubview(environmentLabel)
        stackView.addArrangedSubview(environmentSegmentedControl)
        stackView.addArrangedSubview(customApiUrlLabel)
        stackView.addArrangedSubview(customApiUrlTextField)
        stackView.addArrangedSubview(expirationDaysLabel)
        stackView.addArrangedSubview(expirationDaysTextField)
        stackView.addArrangedSubview(buttonsStack)
        
        contentView.addSubview(stackView)
        
        // Set up constraints
        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
            
            stackView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 20),
            stackView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            stackView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -20)
        ])
    }
    
    private func loadSettings() {
        // Load settings from UserDefaults (shared with extension)
        let userDefaults = UserDefaults(suiteName: "${BUNDLE_ID}.shared")
        
        mnemonicTextView.text = userDefaults?.string(forKey: "mnemonic") ?? ""
        clientIdTextField.text = userDefaults?.string(forKey: "clientId") ?? ""
        
        let environment = userDefaults?.string(forKey: "environment") ?? "production"
        switch environment {
        case "production":
            environmentSegmentedControl.selectedSegmentIndex = 0
        case "staging":
            environmentSegmentedControl.selectedSegmentIndex = 1
        case "custom":
            environmentSegmentedControl.selectedSegmentIndex = 2
            customApiUrlTextField.isHidden = false
        default:
            environmentSegmentedControl.selectedSegmentIndex = 0
        }
        
        customApiUrlTextField.text = userDefaults?.string(forKey: "customApiUrl") ?? ""
        expirationDaysTextField.text = String(userDefaults?.integer(forKey: "expirationDays") ?? 7)
    }
    
    @objc private func environmentChanged() {
        customApiUrlTextField.isHidden = environmentSegmentedControl.selectedSegmentIndex != 2
    }
    
    @objc private func generateMnemonic() {
        // In a real app, you would generate a proper BIP39 mnemonic
        // For this example, we'll just use a placeholder
        mnemonicTextView.text = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15 word16 word17 word18 word19 word20 word21 word22 word23 word24"
    }
    
    @objc private func toggleMnemonicVisibility() {
        mnemonicTextView.isSecureTextEntry = !mnemonicTextView.isSecureTextEntry
    }
    
    @objc private func saveSettings() {
        let userDefaults = UserDefaults(suiteName: "${BUNDLE_ID}.shared")
        
        userDefaults?.set(mnemonicTextView.text, forKey: "mnemonic")
        userDefaults?.set(clientIdTextField.text, forKey: "clientId")
        
        let environmentIndex = environmentSegmentedControl.selectedSegmentIndex
        let environment: String
        switch environmentIndex {
        case 0:
            environment = "production"
        case 1:
            environment = "staging"
        case 2:
            environment = "custom"
        default:
            environment = "production"
        }
        
        userDefaults?.set(environment, forKey: "environment")
        userDefaults?.set(customApiUrlTextField.text, forKey: "customApiUrl")
        userDefaults?.set(Int(expirationDaysTextField.text ?? "7") ?? 7, forKey: "expirationDays")
        
        userDefaults?.synchronize()
        
        // Show success message
        let alert = UIAlertController(title: "Settings Saved", message: "Your settings have been saved successfully.", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    @objc private func resetToDefault() {
        mnemonicTextView.text = ""
        clientIdTextField.text = ""
        environmentSegmentedControl.selectedSegmentIndex = 0
        customApiUrlTextField.text = ""
        customApiUrlTextField.isHidden = true
        expirationDaysTextField.text = "7"
    }
}
EOL

# Create Safari Extension files
cat > ${APP_NAME}App/${APP_NAME}Extension/SafariWebExtensionHandler.swift << EOL
import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any]
        
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@", message ?? [:])
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response": "Received message" ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
EOL

# Create Info.plist for the main app
cat > ${APP_NAME}App/${APP_NAME}App/Info.plist << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>\$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>\$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>\$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIApplicationSupportsIndirectInputEvents</key>
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
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
EOL

# Create Info.plist for the extension
cat > ${APP_NAME}App/${APP_NAME}Extension/Info.plist << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>\$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>\$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>\$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>XPC!</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>\$(MACOSX_DEPLOYMENT_TARGET)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>\$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler</string>
    </dict>
</dict>
</plist>
EOL

# Create a script to copy Chrome extension resources to Safari extension
cat > copy_extension_resources.sh << EOL
#!/bin/bash
set -e

# Source directory (Chrome extension)
SRC_DIR="../extension"

# Destination directory (Safari extension)
DEST_DIR="${APP_NAME}App/${APP_NAME}Extension/Resources"

# Create destination directory if it doesn't exist
mkdir -p "\$DEST_DIR"

# Copy manifest.json and modify for Safari
cp "\$SRC_DIR/manifest.json" "\$DEST_DIR/manifest.json"

# Copy HTML files
cp "\$SRC_DIR/popup.html" "\$DEST_DIR/"
cp "\$SRC_DIR/settings.html" "\$DEST_DIR/"
cp "\$SRC_DIR/history.html" "\$DEST_DIR/"

# Copy CSS files
cp "\$SRC_DIR/popup.css" "\$DEST_DIR/"
cp "\$SRC_DIR/settings.css" "\$DEST_DIR/"
cp "\$SRC_DIR/history.css" "\$DEST_DIR/"

# Copy JavaScript files
# Note: You'll need to build these from the source files
# For now, we'll create placeholder files
touch "\$DEST_DIR/popup.js"
touch "\$DEST_DIR/settings.js"
touch "\$DEST_DIR/history.js"
touch "\$DEST_DIR/background.js"
touch "\$DEST_DIR/content-script.js"

echo "Extension resources copied successfully!"
EOL

chmod +x copy_extension_resources.sh

# Create a script to generate Xcode project
cat > generate_xcode_project.sh << EOL
#!/bin/bash
set -e

# Create Xcode project
cd ${APP_NAME}App
xcodegen generate

# Open the project in Xcode
open ${APP_NAME}.xcodeproj
EOL

chmod +x generate_xcode_project.sh

# Create XcodeGen project specification
mkdir -p ${APP_NAME}App
cat > ${APP_NAME}App/project.yml << EOL
name: ${APP_NAME}
options:
  bundleIdPrefix: ${ORGANIZATION_ID}
targets:
  ${APP_NAME}App:
    type: application
    platform: iOS
    deploymentTarget: "15.0"
    sources:
      - path: ${APP_NAME}App
    info:
      path: ${APP_NAME}App/Info.plist
      properties:
        CFBundleDisplayName: ${APP_NAME}
        UILaunchStoryboardName: LaunchScreen
        UISupportedInterfaceOrientations:
          - UIInterfaceOrientationPortrait
        NSExtensionPointIdentifier: com.apple.Safari.web-extension
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: ${BUNDLE_ID}
        DEVELOPMENT_TEAM: ${TEAM_ID}
        CODE_SIGN_STYLE: Automatic
        TARGETED_DEVICE_FAMILY: "1,2"
    dependencies:
      - target: ${APP_NAME}Extension
  
  ${APP_NAME}Extension:
    type: app-extension
    platform: iOS
    deploymentTarget: "15.0"
    sources:
      - path: ${APP_NAME}Extension
    info:
      path: ${APP_NAME}Extension/Info.plist
      properties:
        CFBundleDisplayName: ${APP_NAME} Extension
        NSExtension:
          NSExtensionPointIdentifier: com.apple.Safari.web-extension
          NSExtensionPrincipalClass: \$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: ${BUNDLE_ID}.Extension
        DEVELOPMENT_TEAM: ${TEAM_ID}
        CODE_SIGN_STYLE: Automatic
        INFOPLIST_FILE: ${APP_NAME}Extension/Info.plist
        TARGETED_DEVICE_FAMILY: "1,2"
EOL

# Create a README file with instructions
cat > README_SAFARI_EXTENSION.md << EOL
# ChronicleSync Safari Extension

This directory contains the Safari extension version of ChronicleSync.

## Setup Instructions

1. Make sure you have Xcode installed on your Mac.

2. Update the TEAM_ID in the create_safari_extension.sh script with your Apple Developer Team ID.

3. Run the setup script:
   \`\`\`
   ./create_safari_extension.sh
   \`\`\`

4. Run the copy_extension_resources.sh script to copy Chrome extension resources:
   \`\`\`
   ./copy_extension_resources.sh
   \`\`\`

5. Install XcodeGen if you don't have it already:
   \`\`\`
   brew install xcodegen
   \`\`\`

6. Generate the Xcode project:
   \`\`\`
   ./generate_xcode_project.sh
   \`\`\`

7. Open the Xcode project and build the app.

## Project Structure

- \`${APP_NAME}App\`: Main iOS application
  - Contains settings UI and app configuration
  
- \`${APP_NAME}Extension\`: Safari Extension
  - Contains the web extension resources

## Development Notes

- The Safari extension uses the same resources as the Chrome extension
- Shared settings are stored in UserDefaults with a shared suite name
- You may need to adapt some JavaScript code to work with Safari's extension API

## Building for Distribution

1. Update the bundle identifier and team ID in the project.yml file
2. Generate a new Xcode project
3. Build and archive the app in Xcode
4. Submit to the App Store

## Troubleshooting

- If you encounter code signing issues, make sure your Apple Developer account is properly set up
- For extension loading issues, check Safari's extension preferences
EOL

echo "Safari extension project setup complete!"
echo "Please follow the instructions in README_SAFARI_EXTENSION.md to complete the setup."