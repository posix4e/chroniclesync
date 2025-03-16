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
        if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(settingsUrl)
        }
    }
    
    func updateStatusLabel() {
        // On iOS, we can't programmatically check if the extension is enabled
        // We can only provide instructions to the user
        statusLabel.text = "To enable the ChronicleSync extension:\n1. Open Safari\n2. Tap the 'Aa' button in the address bar\n3. Select 'Manage Extensions'\n4. Enable ChronicleSync"
        enableExtensionButton.setTitle("Open Settings", for: .normal)
    }
}