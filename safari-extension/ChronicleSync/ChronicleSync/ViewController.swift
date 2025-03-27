import UIKit
import SafariServices

class ViewController: UIViewController {
    
    private let enableExtensionButton = UIButton(type: .system)
    private let instructionsLabel = UILabel()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Configure instructions label
        instructionsLabel.text = "Welcome to ChronicleSync Safari Extension!\n\nTo enable the extension:\n1. Open Settings\n2. Go to Safari > Extensions\n3. Enable ChronicleSync\n4. Allow permissions when prompted"
        instructionsLabel.numberOfLines = 0
        instructionsLabel.textAlignment = .center
        instructionsLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(instructionsLabel)
        
        // Configure button
        enableExtensionButton.setTitle("Open Safari Settings", for: .normal)
        enableExtensionButton.addTarget(self, action: #selector(openSafariSettings), for: .touchUpInside)
        enableExtensionButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(enableExtensionButton)
        
        // Layout constraints
        NSLayoutConstraint.activate([
            instructionsLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            instructionsLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -50),
            instructionsLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            instructionsLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            enableExtensionButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            enableExtensionButton.topAnchor.constraint(equalTo: instructionsLabel.bottomAnchor, constant: 30),
            enableExtensionButton.widthAnchor.constraint(equalToConstant: 200),
            enableExtensionButton.heightAnchor.constraint(equalToConstant: 44)
        ])
    }
    
    @objc private func openSafariSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }
}