import UIKit
import SafariServices

class ViewController: UIViewController {
    
    @IBOutlet weak var enableExtensionButton: UIButton!
    @IBOutlet weak var viewHistoryButton: UIButton!
    @IBOutlet weak var settingsButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        title = "ChronicleSync"
        
        enableExtensionButton.layer.cornerRadius = 8
        viewHistoryButton.layer.cornerRadius = 8
        settingsButton.layer.cornerRadius = 8
    }
    
    @IBAction func enableExtensionTapped(_ sender: Any) {
        // Open Safari Settings to enable the extension
        let url = URL(string: "App-prefs:Safari&path=WEB_EXTENSIONS")!
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
    }
    
    @IBAction func viewHistoryTapped(_ sender: Any) {
        // This would typically open a view controller showing the history
        // For now, we'll just show an alert
        let alert = UIAlertController(title: "History", message: "History view will be implemented here", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    @IBAction func settingsTapped(_ sender: Any) {
        // This would typically open a settings view controller
        // For now, we'll just show an alert
        let alert = UIAlertController(title: "Settings", message: "Settings view will be implemented here", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    @IBAction func openSafariTapped(_ sender: Any) {
        // Open Safari
        let url = URL(string: "https://www.apple.com/safari/")!
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
    }
}