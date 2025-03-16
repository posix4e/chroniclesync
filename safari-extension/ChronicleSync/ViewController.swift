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
        
        // Check if extension is enabled in UserDefaults
        let extensionEnabled = UserDefaults.standard.bool(forKey: "extensionEnabled")
        if extensionEnabled {
            statusLabel.text = "ChronicleSync extension is enabled.\n\nYou can use the Settings tab to configure the extension."
            enableExtensionButton.setTitle("Open Safari", for: .normal)
        }
    }
    
    @IBAction func openSettings(_ sender: Any) {
        // Open Safari browser
        if let safariURL = URL(string: "https://www.apple.com/safari/") {
            UIApplication.shared.open(safariURL, options: [:], completionHandler: nil)
        }
    }
    
    func updateStatusLabel() {
        // On iOS, we can't programmatically check if the extension is enabled
        // We can only provide instructions to the user
        let extensionEnabled = UserDefaults.standard.bool(forKey: "extensionEnabled")
        
        if extensionEnabled {
            statusLabel.text = "ChronicleSync extension is enabled.\n\nYou can use the Settings tab to configure the extension."
        } else {
            statusLabel.text = "To enable the ChronicleSync extension:\n\n1. Tap the 'Open Safari' button below\n2. In Safari, tap the 'Aa' button in the address bar\n3. Select 'Manage Extensions'\n4. Enable ChronicleSync\n5. Allow permissions when prompted\n\nOr use the Settings tab to enable the extension."
        }
        
        enableExtensionButton.setTitle("Open Safari", for: .normal)
    }
}