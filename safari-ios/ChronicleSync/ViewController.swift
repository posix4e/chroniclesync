import UIKit
import SafariServices

class ViewController: UIViewController {
    
    @IBOutlet weak var enableExtensionButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        title = "ChronicleSync"
        
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
        
        // Add instructions label
        let instructionsLabel = UILabel()
        instructionsLabel.translatesAutoresizingMaskIntoConstraints = false
        instructionsLabel.text = "To use ChronicleSync, you need to enable the Safari extension in Settings."
        instructionsLabel.textAlignment = .center
        instructionsLabel.numberOfLines = 0
        
        view.addSubview(instructionsLabel)
        
        NSLayoutConstraint.activate([
            instructionsLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            instructionsLabel.bottomAnchor.constraint(equalTo: enableExtensionButton.topAnchor, constant: -20),
            instructionsLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            instructionsLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
    }
    
    @objc func openSafariExtensionPreferences() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "xyz.chroniclesync.ChronicleSync.Extension") { error in
            guard error == nil else {
                // Show an error if the extension is not found
                let alert = UIAlertController(
                    title: "Error",
                    message: "Could not open Safari extension preferences. Please go to Settings > Safari > Extensions to enable the ChronicleSync extension.",
                    preferredStyle: .alert
                )
                alert.addAction(UIAlertAction(title: "OK", style: .default))
                self.present(alert, animated: true)
                return
            }
        }
    }
}