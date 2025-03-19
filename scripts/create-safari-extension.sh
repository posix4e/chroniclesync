#!/bin/bash
set -e

# Create a directory for the Safari extension project
mkdir -p SafariExtension
cd SafariExtension

# Create Xcode project structure
mkdir -p ChronicleSync
mkdir -p ChronicleSync/ChronicleSync
mkdir -p ChronicleSync/ChronicleSync/Base.lproj
mkdir -p ChronicleSync/ChronicleSync/Assets.xcassets
mkdir -p ChronicleSync/ChronicleSync/Resources
mkdir -p ChronicleSync/ChronicleSync/ViewControllers
mkdir -p ChronicleSync/ChronicleSync/Models
mkdir -p ChronicleSync/ChronicleSync/Helpers

mkdir -p ChronicleSync/ChronicleSync\ Extension
mkdir -p ChronicleSync/ChronicleSync\ Extension/Resources

# Create AppDelegate.swift
cat > ChronicleSync/ChronicleSync/AppDelegate.swift << 'EOF'
import UIKit
import SafariServices

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        let navigationController = UINavigationController(rootViewController: MainViewController())
        window?.rootViewController = navigationController
        window?.makeKeyAndVisible()
        return true
    }
}
EOF

# Create MainViewController.swift
cat > ChronicleSync/ChronicleSync/ViewControllers/MainViewController.swift << 'EOF'
import UIKit
import SafariServices

class MainViewController: UIViewController {
    private let stackView = UIStackView()
    private let titleLabel = UILabel()
    private let instructionsLabel = UILabel()
    private let settingsButton = UIButton(type: .system)
    private let historyButton = UIButton(type: .system)
    private let safariButton = UIButton(type: .system)
    
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "ChronicleSync"
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Configure stack view
        stackView.axis = .vertical
        stackView.spacing = 20
        stackView.alignment = .center
        stackView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stackView)
        
        // Title
        titleLabel.text = "ChronicleSync"
        titleLabel.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        stackView.addArrangedSubview(titleLabel)
        
        // Instructions
        instructionsLabel.text = "To enable the Safari extension:\n1. Open Settings\n2. Go to Safari > Extensions\n3. Enable ChronicleSync extension"
        instructionsLabel.numberOfLines = 0
        instructionsLabel.textAlignment = .center
        stackView.addArrangedSubview(instructionsLabel)
        
        // Settings Button
        settingsButton.setTitle("Settings", for: .normal)
        settingsButton.addTarget(self, action: #selector(openSettings), for: .touchUpInside)
        settingsButton.backgroundColor = .systemBlue
        settingsButton.setTitleColor(.white, for: .normal)
        settingsButton.layer.cornerRadius = 8
        settingsButton.contentEdgeInsets = UIEdgeInsets(top: 10, left: 20, bottom: 10, right: 20)
        stackView.addArrangedSubview(settingsButton)
        
        // History Button
        historyButton.setTitle("View History", for: .normal)
        historyButton.addTarget(self, action: #selector(openHistory), for: .touchUpInside)
        historyButton.backgroundColor = .systemGreen
        historyButton.setTitleColor(.white, for: .normal)
        historyButton.layer.cornerRadius = 8
        historyButton.contentEdgeInsets = UIEdgeInsets(top: 10, left: 20, bottom: 10, right: 20)
        stackView.addArrangedSubview(historyButton)
        
        // Safari Button
        safariButton.setTitle("Open Safari Extension Settings", for: .normal)
        safariButton.addTarget(self, action: #selector(openSafariSettings), for: .touchUpInside)
        safariButton.backgroundColor = .systemOrange
        safariButton.setTitleColor(.white, for: .normal)
        safariButton.layer.cornerRadius = 8
        safariButton.contentEdgeInsets = UIEdgeInsets(top: 10, left: 20, bottom: 10, right: 20)
        stackView.addArrangedSubview(safariButton)
        
        // Layout constraints
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
    
    @objc private func openHistory() {
        let historyVC = HistoryViewController()
        navigationController?.pushViewController(historyVC, animated: true)
    }
    
    @objc private func openSafariSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }
}
EOF

# Create SettingsViewController.swift
cat > ChronicleSync/ChronicleSync/ViewControllers/SettingsViewController.swift << 'EOF'
import UIKit
import WebKit

class SettingsViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    private var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Settings"
        setupWebView()
        loadSettingsPage()
    }
    
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "settingsHandler")
        configuration.userContentController = userContentController
        
        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.navigationDelegate = self
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)
    }
    
    private func loadSettingsPage() {
        if let settingsURL = Bundle.main.url(forResource: "settings", withExtension: "html") {
            webView.loadFileURL(settingsURL, allowingReadAccessTo: settingsURL.deletingLastPathComponent())
        } else {
            let html = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Settings</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; }
                    h1 { color: #333; }
                </style>
            </head>
            <body>
                <h1>Settings</h1>
                <p>Settings content will be loaded here.</p>
            </body>
            </html>
            """
            webView.loadHTMLString(html, baseURL: nil)
        }
    }
    
    // MARK: - WKScriptMessageHandler
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "settingsHandler", let messageBody = message.body as? [String: Any] {
            // Handle messages from the web view
            print("Received message from settings page: \(messageBody)")
        }
    }
}
EOF

# Create HistoryViewController.swift
cat > ChronicleSync/ChronicleSync/ViewControllers/HistoryViewController.swift << 'EOF'
import UIKit
import WebKit

class HistoryViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    private var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "History"
        setupWebView()
        loadHistoryPage()
    }
    
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "historyHandler")
        configuration.userContentController = userContentController
        
        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.navigationDelegate = self
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)
    }
    
    private func loadHistoryPage() {
        if let historyURL = Bundle.main.url(forResource: "history", withExtension: "html") {
            webView.loadFileURL(historyURL, allowingReadAccessTo: historyURL.deletingLastPathComponent())
        } else {
            let html = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>History</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; }
                    h1 { color: #333; }
                </style>
            </head>
            <body>
                <h1>History</h1>
                <p>History content will be loaded here.</p>
            </body>
            </html>
            """
            webView.loadHTMLString(html, baseURL: nil)
        }
    }
    
    // MARK: - WKScriptMessageHandler
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "historyHandler", let messageBody = message.body as? [String: Any] {
            // Handle messages from the web view
            print("Received message from history page: \(messageBody)")
        }
    }
}
EOF

# Create SafariWebExtensionHandler.swift
cat > ChronicleSync/ChronicleSync\ Extension/SafariWebExtensionHandler.swift << 'EOF'
import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@", message as? [String: Any] ?? [:])
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response": "Received" ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
EOF

# Create Info.plist for the app
cat > ChronicleSync/ChronicleSync/Info.plist << 'EOF'
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
EOF

# Create Info.plist for the Safari extension
cat > ChronicleSync/ChronicleSync\ Extension/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler</string>
        <key>SFSafariWebExtensionConverterVersion</key>
        <string>14.0</string>
    </dict>
</dict>
</plist>
EOF

# Create LaunchScreen.storyboard
cat > ChronicleSync/ChronicleSync/Base.lproj/LaunchScreen.storyboard << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21507" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina6_12" orientation="portrait" appearance="light"/>
    <dependencies>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21505"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="System colors in document resources" minToolsVersion="11.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--View Controller-->
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="ChronicleSync" textAlignment="natural" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="Agh-Xd-DaX">
                                <rect key="frame" x="107.66666666666669" y="408.66666666666669" width="178" height="35"/>
                                <fontDescription key="fontDescription" type="system" pointSize="29"/>
                                <nil key="textColor"/>
                                <nil key="highlightedColor"/>
                            </label>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="6Tk-OE-BBY"/>
                        <color key="backgroundColor" systemColor="systemBackgroundColor"/>
                        <constraints>
                            <constraint firstItem="Agh-Xd-DaX" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY" id="Aqe-Jc-0Xc"/>
                            <constraint firstItem="Agh-Xd-DaX" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX" id="Qqg-Jc-Aqe"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="53" y="375"/>
        </scene>
    </scenes>
    <resources>
        <systemColor name="systemBackgroundColor">
            <color white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
        </systemColor>
    </resources>
</document>
EOF

# Create project.pbxproj template
mkdir -p ChronicleSync/ChronicleSync.xcodeproj
cat > ChronicleSync/ChronicleSync.xcodeproj/project.pbxproj << 'EOF'
// !$*UTF8*$!
{
    archiveVersion = 1;
    classes = {
    };
    objectVersion = 55;
    objects = {
        /* Begin PBXBuildFile section */
        /* End PBXBuildFile section */
        /* Begin PBXFileReference section */
        /* End PBXFileReference section */
        /* Begin PBXFrameworksBuildPhase section */
        /* End PBXFrameworksBuildPhase section */
        /* Begin PBXGroup section */
        /* End PBXGroup section */
        /* Begin PBXNativeTarget section */
        /* End PBXNativeTarget section */
        /* Begin PBXProject section */
        /* End PBXProject section */
        /* Begin PBXResourcesBuildPhase section */
        /* End PBXResourcesBuildPhase section */
        /* Begin PBXSourcesBuildPhase section */
        /* End PBXSourcesBuildPhase section */
        /* Begin XCBuildConfiguration section */
        /* End XCBuildConfiguration section */
        /* Begin XCConfigurationList section */
        /* End XCConfigurationList section */
    };
    rootObject = 29B97313FDCFA39411CA2CEA /* Project object */;
}
EOF

# Create build script for Xcode project
cat > build-safari-extension.sh << 'EOF'
#!/bin/bash
set -e

# Navigate to the Xcode project directory
cd ChronicleSync

# Create a build directory
mkdir -p build

# Build the app for iOS
xcodebuild -project ChronicleSync.xcodeproj -scheme ChronicleSync -sdk iphoneos -configuration Release -allowProvisioningUpdates

# Create IPA file
mkdir -p build/Release-iphoneos/Payload
cp -r build/Release-iphoneos/ChronicleSync.app build/Release-iphoneos/Payload/
cd build/Release-iphoneos
zip -r ChronicleSync.ipa Payload

# Move IPA to artifacts directory
mkdir -p ../../artifacts
mv ChronicleSync.ipa ../../artifacts/

echo "Safari extension IPA built successfully at: artifacts/ChronicleSync.ipa"
EOF

chmod +x build-safari-extension.sh

echo "Safari extension project structure created successfully!"