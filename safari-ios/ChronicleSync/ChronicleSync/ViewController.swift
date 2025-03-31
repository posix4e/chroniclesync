import UIKit
import SafariServices

class ViewController: UIViewController {
    
    @IBOutlet weak var enableExtensionButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Create a button programmatically if not using Interface Builder
        if enableExtensionButton == nil {
            let button = UIButton(type: .system)
            button.translatesAutoresizingMaskIntoConstraints = false
            button.setTitle("Enable Safari Extension", for: .normal)
            button.addTarget(self, action: #selector(openSafariExtensionPreferences), for: .touchUpInside)
            
            view.addSubview(button)
            
            NSLayoutConstraint.activate([
                button.centerXAnchor.constraint(equalTo: view.centerXAnchor),
                button.centerYAnchor.constraint(equalTo: view.centerYAnchor)
            ])
            
            enableExtensionButton = button
        }
    }
    
    @IBAction func openSafariExtensionPreferences(_ sender: Any) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "xyz.chroniclesync.ChronicleSync.Extension") { error in
            guard error == nil else {
                // Handle error
                print("Error opening Safari extension preferences: \(String(describing: error))")
                return
            }
            // Successfully opened preferences
        }
    }
}