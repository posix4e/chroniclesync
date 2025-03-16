import UIKit
import SafariServices

class ViewController: UIViewController {
    
    @IBOutlet weak var enableExtensionButton: UIButton!
    @IBOutlet weak var statusLabel: UILabel!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        updateStatusLabel()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        updateStatusLabel()
    }
    
    @IBAction func openSettings(_ sender: Any) {
        // Open Safari settings directly using the Safari settings URL scheme
        if let safariSettingsUrl = URL(string: "App-prefs:SAFARI&path=WEB_EXTENSIONS") {
            UIApplication.shared.open(safariSettingsUrl, options: [:]) { success in
                if !success {
                    // Fallback to general app settings if Safari settings URL doesn't work
                    if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(settingsUrl)
                    }
                }
            }
        } else {
            // Fallback to general app settings
            if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(settingsUrl)
            }
        }
    }
    
    func updateStatusLabel() {
        // On iOS, we can't programmatically check if the extension is enabled
        // We can only provide instructions to the user
        statusLabel.text = "To enable the ChronicleSync extension:\n\nTap the 'Open Safari Settings' button below, then:\n1. Select 'Extensions'\n2. Enable ChronicleSync\n3. Allow permissions when prompted"
        enableExtensionButton.setTitle("Open Safari Settings", for: .normal)
    }
}