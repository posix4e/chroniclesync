import UIKit
import SafariServices

class ViewController: UIViewController {
    
    @IBOutlet weak var enableExtensionButton: UIButton!
    @IBOutlet weak var statusLabel: UILabel!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        updateExtensionStatus()
    }
    
    @IBAction func openSettings(_ sender: Any) {
        if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(settingsUrl)
        }
    }
    
    @IBAction func showInstructions(_ sender: Any) {
        let alertController = UIAlertController(
            title: "Enable ChronicleSync Extension",
            message: "1. Open Settings\n2. Go to Safari > Extensions\n3. Enable ChronicleSync\n4. Allow permissions when prompted",
            preferredStyle: .alert
        )
        alertController.addAction(UIAlertAction(title: "OK", style: .default))
        present(alertController, animated: true)
    }
    
    func updateExtensionStatus() {
        // In a real app, you would check if the extension is enabled
        // This is a placeholder since we can't directly check extension status
        statusLabel.text = "Extension status: Please enable in Safari settings"
    }
}