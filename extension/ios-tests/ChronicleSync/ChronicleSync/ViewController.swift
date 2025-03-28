import UIKit
import SafariServices

class ViewController: UIViewController {
    
    @IBOutlet weak var statusLabel: UILabel!
    @IBOutlet weak var openSafariButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        statusLabel.text = "ChronicleSync Safari Extension"
        openSafariButton.addTarget(self, action: #selector(openSafari), for: .touchUpInside)
    }
    
    @objc func openSafari() {
        // Open Safari with a test URL
        if let url = URL(string: "https://www.example.com") {
            let safariVC = SFSafariViewController(url: url)
            present(safariVC, animated: true, completion: nil)
        }
    }
    
    @IBAction func openExtensionSettings(_ sender: Any) {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }
}