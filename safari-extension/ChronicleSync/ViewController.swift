import UIKit
import SafariServices

class ViewController: UIViewController {
    
    @IBOutlet weak var enableExtensionButton: UIButton!
    @IBOutlet weak var statusLabel: UILabel!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("ViewController: viewDidLoad called")
        
        // Debug: Check if outlets are connected
        if enableExtensionButton == nil {
            print("ERROR: enableExtensionButton outlet is nil")
        } else {
            print("enableExtensionButton outlet is connected")
        }
        
        if statusLabel == nil {
            print("ERROR: statusLabel outlet is nil")
        } else {
            print("statusLabel outlet is connected")
        }
        
        // Debug: Check extension resources
        debugCheckExtensionResources()
        
        updateStatusLabel()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        print("ViewController: viewDidAppear called")
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
    
    @IBAction func openSettings(_ sender: Any) {
        print("ViewController: openSettings called")
        // Open Safari browser
        if let safariURL = URL(string: "https://www.apple.com/safari/") {
            UIApplication.shared.open(safariURL, options: [:], completionHandler: nil)
        }
    }
    
    func updateStatusLabel() {
        print("ViewController: updateStatusLabel called")
        // On iOS, we can't programmatically check if the extension is enabled
        // We can only provide instructions to the user
        let extensionEnabled = UserDefaults.standard.bool(forKey: "extensionEnabled")
        
        if extensionEnabled {
            statusLabel?.text = "ChronicleSync extension is enabled.\n\nYou can use the Settings tab to configure the extension."
        } else {
            statusLabel?.text = "To enable the ChronicleSync extension:\n\n1. Tap the 'Open Safari' button below\n2. In Safari, tap the 'Aa' button in the address bar\n3. Select 'Manage Extensions'\n4. Enable ChronicleSync\n5. Allow permissions when prompted\n\nOr use the Settings tab to enable the extension."
        }
        
        enableExtensionButton?.setTitle("Open Safari", for: .normal)
    }
    
    // MARK: - Debug Methods
    
    func debugCheckExtensionResources() {
        print("=== Checking Extension Resources ===")
        
        // Check main bundle
        let mainBundle = Bundle.main
        print("Main bundle identifier: \(mainBundle.bundleIdentifier ?? "Unknown")")
        
        // Check extension bundle
        let extensionBundleID = mainBundle.bundleIdentifier?.appending(".extension") ?? "Unknown.extension"
        print("Expected extension bundle ID: \(extensionBundleID)")
        
        // Check resources path
        if let resourcesPath = mainBundle.resourcePath {
            print("Resources path: \(resourcesPath)")
            
            // Check for extension resources directory
            let extensionResourcesPath = resourcesPath + "/Resources"
            if FileManager.default.fileExists(atPath: extensionResourcesPath) {
                print("Extension resources directory found at: \(extensionResourcesPath)")
                
                // List files in the resources directory
                do {
                    let files = try FileManager.default.contentsOfDirectory(atPath: extensionResourcesPath)
                    print("Files in Resources directory:")
                    for file in files {
                        print("- \(file)")
                    }
                } catch {
                    print("Error listing files: \(error)")
                }
                
                // Check for specific files
                let manifestPath = extensionResourcesPath + "/manifest.json"
                if FileManager.default.fileExists(atPath: manifestPath) {
                    print("manifest.json found")
                } else {
                    print("ERROR: manifest.json not found")
                }
                
                let popupHTMLPath = extensionResourcesPath + "/popup.html"
                if FileManager.default.fileExists(atPath: popupHTMLPath) {
                    print("popup.html found")
                } else {
                    print("ERROR: popup.html not found")
                }
                
                let backgroundJSPath = extensionResourcesPath + "/background.js"
                if FileManager.default.fileExists(atPath: backgroundJSPath) {
                    print("background.js found")
                } else {
                    print("ERROR: background.js not found")
                }
            } else {
                print("ERROR: Extension resources directory not found")
            }
        } else {
            print("ERROR: Resources path not found")
        }
    }
    
    func createFallbackUI() {
        print("Creating fallback UI because outlets are nil")
        
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