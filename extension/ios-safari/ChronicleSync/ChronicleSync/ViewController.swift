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
    
    @IBAction func openExtensionSettings(_ sender: Any) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "xyz.chroniclesync.ios.extension") { error in
            guard error == nil else {
                self.showError("Could not open Safari extension preferences: \(error!.localizedDescription)")
                return
            }
            
            // After a short delay, check the status again
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.updateExtensionStatus()
            }
        }
    }
    
    private func updateExtensionStatus() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: "xyz.chroniclesync.ios.extension") { state, error in
            guard let state = state, error == nil else {
                self.showError("Could not determine extension state: \(error?.localizedDescription ?? "Unknown error")")
                return
            }
            
            DispatchQueue.main.async {
                if state.isEnabled {
                    self.statusLabel.text = "ChronicleSync extension is enabled."
                    self.statusLabel.textColor = .systemGreen
                    self.enableExtensionButton.setTitle("Extension Settings", for: .normal)
                } else {
                    self.statusLabel.text = "ChronicleSync extension is disabled."
                    self.statusLabel.textColor = .systemRed
                    self.enableExtensionButton.setTitle("Enable Extension", for: .normal)
                }
            }
        }
    }
    
    private func showError(_ message: String) {
        DispatchQueue.main.async {
            let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            self.present(alert, animated: true)
        }
    }
}