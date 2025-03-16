import Cocoa
import SafariServices
import WebKit

class ViewController: NSViewController {

    @IBOutlet weak var enableExtensionButton: NSButton!
    @IBOutlet weak var viewHistoryButton: NSButton!
    @IBOutlet weak var settingsButton: NSButton!
    @IBOutlet weak var openSafariButton: NSButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        view.wantsLayer = true
        
        enableExtensionButton.wantsLayer = true
        enableExtensionButton.layer?.cornerRadius = 8
        
        viewHistoryButton.wantsLayer = true
        viewHistoryButton.layer?.cornerRadius = 8
        
        settingsButton.wantsLayer = true
        settingsButton.layer?.cornerRadius = 8
        
        openSafariButton.wantsLayer = true
        openSafariButton.layer?.cornerRadius = 8
    }

    @IBAction func enableExtensionClicked(_ sender: Any) {
        let bundleID = Bundle.main.bundleIdentifier ?? "xyz.chroniclesync.app"
        let extensionBundleID = "\(bundleID).extension"
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleID) { error in
            if let error = error {
                self.showAlert(title: "Error", message: "Could not open Safari extension preferences: \(error.localizedDescription)")
            }
        }
    }
    
    @IBAction func viewHistoryClicked(_ sender: Any) {
        // This would typically open a view controller showing the history
        // For now, we'll just show an alert
        showAlert(title: "History", message: "History view will be implemented here")
    }
    
    @IBAction func settingsClicked(_ sender: Any) {
        // This would typically open a settings view controller
        // For now, we'll just show an alert
        showAlert(title: "Settings", message: "Settings view will be implemented here")
    }
    
    @IBAction func openSafariClicked(_ sender: Any) {
        // Open Safari
        NSWorkspace.shared.open(URL(string: "https://www.apple.com/safari/")!)
    }
    
    private func showAlert(title: String, message: String) {
        let alert = NSAlert()
        alert.messageText = title
        alert.informativeText = message
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
}