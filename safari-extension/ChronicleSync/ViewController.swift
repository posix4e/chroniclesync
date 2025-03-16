import UIKit
import SafariServices
import os.log

/// Main view controller for the ChronicleSync app
class ViewController: UIViewController {
    
    // MARK: - Properties
    
    /// Button to enable the extension or open Safari
    @IBOutlet private weak var enableExtensionButton: UIButton!
    
    /// Label showing the extension status and instructions
    @IBOutlet private weak var statusLabel: UILabel!
    
    /// Logger for debugging
    private let logger = Logger(subsystem: "com.chroniclesync.app", category: "viewcontroller")
    
    // MARK: - Lifecycle Methods
    
    override func viewDidLoad() {
        super.viewDidLoad()
        logger.log("viewDidLoad called")
        
        // Debug: Check if outlets are connected
        if enableExtensionButton == nil {
            logger.error("enableExtensionButton outlet is nil")
        } else {
            logger.log("enableExtensionButton outlet is connected")
        }
        
        if statusLabel == nil {
            logger.error("statusLabel outlet is nil")
        } else {
            logger.log("statusLabel outlet is connected")
        }
        
        // Debug: Check extension resources
        debugCheckExtensionResources()
        
        updateStatusLabel()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        logger.log("viewDidAppear called")
        updateStatusLabel()
        
        // Check if extension is enabled in UserDefaults
        let extensionEnabled = UserDefaults.standard.bool(forKey: "extensionEnabled")
        if extensionEnabled {
            statusLabel?.text = "ChronicleSync extension is enabled.\n\nYou can use the Settings tab to configure the extension."
            enableExtensionButton?.setTitle("Open Safari", for: .normal)
        }
        
        // Debug: Add a fallback UI if outlets are nil
        if statusLabel == nil || enableExtensionButton == nil {
            createFallbackUI()
        }
    }
    
    // MARK: - Actions
    
    /// Opens Safari when the button is tapped
    @IBAction func openSettings(_ sender: Any) {
        logger.log("openSettings called")
        // Open Safari browser
        if let safariURL = URL(string: "https://www.apple.com/safari/") {
            UIApplication.shared.open(safariURL, options: [:], completionHandler: nil)
        }
    }
    
    // MARK: - Helper Methods
    
    /// Updates the status label based on the extension state
    func updateStatusLabel() {
        logger.log("updateStatusLabel called")
        // On iOS, we can't programmatically check if the extension is enabled
        // We can only provide instructions to the user
        let extensionEnabled = UserDefaults.standard.bool(forKey: "extensionEnabled")
        
        if extensionEnabled {
            statusLabel?.text = "ChronicleSync extension is enabled.\n\nYou can use the Settings tab to configure the extension."
        } else {
            statusLabel?.text = """
            To enable the ChronicleSync extension:

            1. Tap the 'Open Safari' button below
            2. In Safari, tap the 'Aa' button in the address bar
            3. Select 'Manage Extensions'
            4. Enable ChronicleSync
            5. Allow permissions when prompted

            Or use the Settings tab to enable the extension.
            """
        }
        
        enableExtensionButton?.setTitle("Open Safari", for: .normal)
    }
    
    // MARK: - Debug Methods
    
    /// Checks if the extension resources are properly loaded
    func debugCheckExtensionResources() {
        logger.log("=== Checking Extension Resources ===")
        
        // Check main bundle
        let mainBundle = Bundle.main
        logger.log("Main bundle identifier: \(mainBundle.bundleIdentifier ?? "Unknown")")
        
        // Check extension bundle
        let extensionBundleID = mainBundle.bundleIdentifier?.appending(".extension") ?? "Unknown.extension"
        logger.log("Expected extension bundle ID: \(extensionBundleID)")
        
        // Check resources path
        if let resourcesPath = mainBundle.resourcePath {
            logger.log("Resources path: \(resourcesPath)")
            
            // Check for extension resources directory
            let extensionResourcesPath = resourcesPath + "/Resources"
            if FileManager.default.fileExists(atPath: extensionResourcesPath) {
                logger.log("Extension resources directory found at: \(extensionResourcesPath)")
                
                // List files in the resources directory
                do {
                    let files = try FileManager.default.contentsOfDirectory(atPath: extensionResourcesPath)
                    logger.log("Files in Resources directory:")
                    for file in files {
                        logger.log("- \(file)")
                    }
                } catch {
                    logger.error("Error listing files: \(error.localizedDescription)")
                }
                
                // Check for specific files
                let manifestPath = extensionResourcesPath + "/manifest.json"
                if FileManager.default.fileExists(atPath: manifestPath) {
                    logger.log("manifest.json found")
                } else {
                    logger.error("manifest.json not found")
                }
                
                let popupHTMLPath = extensionResourcesPath + "/popup.html"
                if FileManager.default.fileExists(atPath: popupHTMLPath) {
                    logger.log("popup.html found")
                } else {
                    logger.error("popup.html not found")
                }
                
                let backgroundJSPath = extensionResourcesPath + "/background.js"
                if FileManager.default.fileExists(atPath: backgroundJSPath) {
                    logger.log("background.js found")
                } else {
                    logger.error("background.js not found")
                }
            } else {
                logger.error("Extension resources directory not found")
            }
        } else {
            logger.error("Resources path not found")
        }
    }
    
    /// Creates a fallback UI when the storyboard connections are broken
    func createFallbackUI() {
        logger.log("Creating fallback UI because outlets are nil")
        
        // Create a label
        let label = UILabel()
        label.text = "ChronicleSync Safari Extension\n\nThere was an issue loading the UI. Please check the console for errors."
        label.numberOfLines = 0
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        
        // Create a button
        let button = UIButton(type: .system)
        button.setTitle("Open Safari", for: .normal)
        button.addTarget(self, action: #selector(openSettings(_:)), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        
        // Add to view
        view.addSubview(label)
        view.addSubview(button)
        
        // Add constraints
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            button.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            button.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 20),
            button.widthAnchor.constraint(greaterThanOrEqualToConstant: 200),
            button.heightAnchor.constraint(equalToConstant: 40)
        ])
    }
}