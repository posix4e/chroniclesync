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
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "xyz.chroniclesync.ChronicleSync-Safari.Extension") { error in
            guard error == nil else {
                self.showError("Failed to open extension settings: \(error!.localizedDescription)")
                return
            }
        }
    }
    
    private func updateExtensionStatus() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: "xyz.chroniclesync.ChronicleSync-Safari.Extension") { [weak self] (state, error) in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                if let state = state, error == nil {
                    if state.isEnabled {
                        self.statusLabel.text = "ChronicleSync Safari Extension is enabled."
                        self.enableExtensionButton.setTitle("Extension Settings", for: .normal)
                    } else {
                        self.statusLabel.text = "ChronicleSync Safari Extension is disabled. Please enable it in Safari settings."
                        self.enableExtensionButton.setTitle("Enable Extension", for: .normal)
                    }
                } else {
                    self.statusLabel.text = "Unable to determine extension status."
                    self.enableExtensionButton.setTitle("Open Safari Settings", for: .normal)
                }
            }
        }
    }
    
    private func showError(_ message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}