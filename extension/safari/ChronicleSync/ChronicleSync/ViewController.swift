import UIKit
import WebKit
import SafariServices

class ViewController: UIViewController {
    @IBOutlet weak var enableExtensionButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        title = "ChronicleSync"
        
        enableExtensionButton.addTarget(self, action: #selector(openSafariExtensionPreferences), for: .touchUpInside)
    }
    
    @objc private func openSafariExtensionPreferences() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "xyz.chroniclesync.ChronicleSync.Extension") { error in
            guard error == nil else {
                // Handle error
                print("Error opening Safari extension preferences: \(error!)")
                return
            }
            // Successfully opened preferences
        }
    }
}