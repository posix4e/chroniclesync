import UIKit
import SafariServices

class ViewController: UIViewController {
    
    @IBOutlet weak var enableExtensionButton: UIButton!
    @IBOutlet weak var viewHistoryButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        print("ViewController: viewDidLoad called")
        
        // Check if outlets are connected
        if enableExtensionButton != nil {
            print("enableExtensionButton outlet is connected")
        }
        
        // Check extension resources
        checkExtensionResources()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        print("ViewController: viewDidAppear called")
        updateStatusLabel()
    }
    
    private func setupUI() {
        title = "ChronicleSync"
        
        enableExtensionButton.layer.cornerRadius = 8
        viewHistoryButton.layer.cornerRadius = 8
    }
    
    private func checkExtensionResources() {
        print("=== Checking Extension Resources ===")
        
        // Get the main bundle identifier
        let mainBundleID = Bundle.main.bundleIdentifier ?? "unknown"
        print("Main bundle identifier: \(mainBundleID)")
        
        // Expected extension bundle ID
        let extensionBundleID = "xyz.chroniclesync.app.extension"
        print("Expected extension bundle ID: \(extensionBundleID)")
        
        // Get the resources path
        if let resourcesPath = Bundle.main.resourcePath {
            print("Resources path: \(resourcesPath)")
            
            // Check if extension resources directory exists
            let extensionResourcesPath = resourcesPath + "/Extension Files"
            let fileManager = FileManager.default
            if fileManager.fileExists(atPath: extensionResourcesPath) {
                print("Extension resources directory found at: \(extensionResourcesPath)")
                
                // Check for manifest.json
                let manifestPath = extensionResourcesPath + "/manifest.json"
                if fileManager.fileExists(atPath: manifestPath) {
                    print("manifest.json found")
                } else {
                    print("ERROR: manifest.json not found")
                }
            } else {
                print("ERROR: Extension resources directory not found")
            }
        }
    }
    
    private func updateStatusLabel() {
        print("ViewController: updateStatusLabel called")
    }
    
    @IBAction func enableExtensionTapped(_ sender: Any) {
        // Open Safari Settings to enable the extension
        let url = URL(string: "App-prefs:Safari&path=WEB_EXTENSIONS")!
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
    }
    
    @IBAction func viewHistoryTapped(_ sender: Any) {
        // Switch to the History tab
        self.tabBarController?.selectedIndex = 1
    }
    
    @IBAction func openSafariTapped(_ sender: Any) {
        print("ViewController: openSettings called")
        // Open Safari
        let url = URL(string: "https://www.apple.com/safari/")!
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
    }
}