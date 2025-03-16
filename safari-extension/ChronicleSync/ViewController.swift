import UIKit
import SafariServices

class ViewController: UIViewController {
    
    @IBOutlet weak var enableExtensionButton: UIButton!
    @IBOutlet weak var statusLabel: UILabel!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        updateExtensionStatus()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        updateExtensionStatus()
    }
    
    @IBAction func openSettings(_ sender: Any) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "com.chroniclesync.app.extension") { error in
            guard error == nil else {
                // Handle error
                self.statusLabel.text = "Error opening extension settings: \(error!.localizedDescription)"
                return
            }
            // Successfully opened settings
            DispatchQueue.main.async {
                self.updateExtensionStatus()
            }
        }
    }
    
    func updateExtensionStatus() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: "com.chroniclesync.app.extension") { (state, error) in
            guard let state = state, error == nil else {
                // Handle error
                DispatchQueue.main.async {
                    self.statusLabel.text = "Error checking extension status: \(error?.localizedDescription ?? "Unknown error")"
                    self.enableExtensionButton.isEnabled = false
                }
                return
            }
            
            DispatchQueue.main.async {
                if state.isEnabled {
                    self.statusLabel.text = "ChronicleSync extension is enabled."
                    self.enableExtensionButton.setTitle("Extension Settings", for: .normal)
                } else {
                    self.statusLabel.text = "ChronicleSync extension is disabled. Please enable it in Safari settings."
                    self.enableExtensionButton.setTitle("Enable Extension", for: .normal)
                }
                self.enableExtensionButton.isEnabled = true
            }
        }
    }
}