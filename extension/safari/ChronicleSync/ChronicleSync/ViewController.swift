import UIKit
import SafariServices

class ViewController: UIViewController {
    
    @IBOutlet weak var enableExtensionButton: UIButton!
    @IBOutlet weak var openSafariButton: UIButton!
    @IBOutlet weak var statusLabel: UILabel!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        updateExtensionStatus()
    }
    
    private func setupUI() {
        title = "ChronicleSync"
        
        enableExtensionButton.layer.cornerRadius = 8
        enableExtensionButton.backgroundColor = .systemBlue
        enableExtensionButton.setTitleColor(.white, for: .normal)
        
        openSafariButton.layer.cornerRadius = 8
        openSafariButton.backgroundColor = .systemGray5
        openSafariButton.setTitleColor(.systemBlue, for: .normal)
    }
    
    private func updateExtensionStatus() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: getExtensionBundleIdentifier()) { [weak self] (state, error) in
            DispatchQueue.main.async {
                if let state = state, state.isEnabled {
                    self?.statusLabel.text = "Extension is enabled"
                    self?.statusLabel.textColor = .systemGreen
                    self?.enableExtensionButton.setTitle("Extension Settings", for: .normal)
                } else {
                    self?.statusLabel.text = "Extension is disabled"
                    self?.statusLabel.textColor = .systemRed
                    self?.enableExtensionButton.setTitle("Enable Extension", for: .normal)
                }
            }
        }
    }
    
    @IBAction func enableExtensionTapped(_ sender: Any) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: getExtensionBundleIdentifier()) { [weak self] error in
            DispatchQueue.main.async {
                if let error = error {
                    let alert = UIAlertController(title: "Error", message: "Could not open Safari extension preferences: \(error.localizedDescription)", preferredStyle: .alert)
                    alert.addAction(UIAlertAction(title: "OK", style: .default))
                    self?.present(alert, animated: true)
                }
                self?.updateExtensionStatus()
            }
        }
    }
    
    @IBAction func openSafariTapped(_ sender: Any) {
        if let url = URL(string: "https://www.chroniclesync.xyz") {
            UIApplication.shared.open(url)
        }
    }
    
    private func getExtensionBundleIdentifier() -> String {
        // Try to get the bundle ID from environment variables first
        if let appID = Bundle.main.infoDictionary?["APPLE_APP_ID"] as? String {
            return "\(appID).extension"
        }
        
        // Default bundle ID
        return "xyz.chroniclesync.app.extension"
    }
}