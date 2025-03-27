import UIKit
import SafariServices

class ViewController: UIViewController {
    
    // UI Elements
    private let titleLabel = UILabel()
    private let descriptionLabel = UILabel()
    private let setupButton = UIButton(type: .system)
    private let settingsButton = UIButton(type: .system)
    private let statusLabel = UILabel()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        checkExtensionStatus()
    }
    
    // MARK: - UI Setup
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Title Label
        titleLabel.text = "ChronicleSync"
        titleLabel.font = UIFont.systemFont(ofSize: 28, weight: .bold)
        titleLabel.textAlignment = .center
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(titleLabel)
        
        // Description Label
        descriptionLabel.text = "Sync your browsing history across all your devices"
        descriptionLabel.font = UIFont.systemFont(ofSize: 16)
        descriptionLabel.textAlignment = .center
        descriptionLabel.numberOfLines = 0
        descriptionLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(descriptionLabel)
        
        // Setup Button
        setupButton.setTitle("Enable Safari Extension", for: .normal)
        setupButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
        setupButton.backgroundColor = .systemBlue
        setupButton.setTitleColor(.white, for: .normal)
        setupButton.layer.cornerRadius = 10
        setupButton.translatesAutoresizingMaskIntoConstraints = false
        setupButton.addTarget(self, action: #selector(openSafariExtensionSettings), for: .touchUpInside)
        view.addSubview(setupButton)
        
        // Settings Button
        settingsButton.setTitle("Open Settings", for: .normal)
        settingsButton.titleLabel?.font = UIFont.systemFont(ofSize: 16)
        settingsButton.translatesAutoresizingMaskIntoConstraints = false
        settingsButton.addTarget(self, action: #selector(openSettings), for: .touchUpInside)
        view.addSubview(settingsButton)
        
        // Status Label
        statusLabel.text = "Extension status: Checking..."
        statusLabel.font = UIFont.systemFont(ofSize: 14)
        statusLabel.textAlignment = .center
        statusLabel.textColor = .secondaryLabel
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(statusLabel)
        
        // Setup Constraints
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 40),
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            descriptionLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 20),
            descriptionLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            descriptionLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            descriptionLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40),
            
            setupButton.topAnchor.constraint(equalTo: descriptionLabel.bottomAnchor, constant: 60),
            setupButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            setupButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            setupButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40),
            setupButton.heightAnchor.constraint(equalToConstant: 50),
            
            settingsButton.topAnchor.constraint(equalTo: setupButton.bottomAnchor, constant: 20),
            settingsButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            
            statusLabel.topAnchor.constraint(equalTo: settingsButton.bottomAnchor, constant: 40),
            statusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            statusLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            statusLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
        
        // Add Safari Extension Setup Instructions
        addSetupInstructions()
    }
    
    private func addSetupInstructions() {
        let instructionsView = UIView()
        instructionsView.backgroundColor = .systemGray6
        instructionsView.layer.cornerRadius = 10
        instructionsView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(instructionsView)
        
        let instructionsTitle = UILabel()
        instructionsTitle.text = "How to enable the extension:"
        instructionsTitle.font = UIFont.systemFont(ofSize: 16, weight: .semibold)
        instructionsTitle.translatesAutoresizingMaskIntoConstraints = false
        instructionsView.addSubview(instructionsTitle)
        
        let instructionsText = UILabel()
        instructionsText.text = "1. Tap 'Enable Safari Extension' above\n2. Enable ChronicleSync\n3. Tap 'All Websites' and select 'Allow'\n4. Return to this app"
        instructionsText.font = UIFont.systemFont(ofSize: 14)
        instructionsText.numberOfLines = 0
        instructionsText.translatesAutoresizingMaskIntoConstraints = false
        instructionsView.addSubview(instructionsText)
        
        NSLayoutConstraint.activate([
            instructionsView.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 30),
            instructionsView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            instructionsView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            instructionsTitle.topAnchor.constraint(equalTo: instructionsView.topAnchor, constant: 15),
            instructionsTitle.leadingAnchor.constraint(equalTo: instructionsView.leadingAnchor, constant: 15),
            instructionsTitle.trailingAnchor.constraint(equalTo: instructionsView.trailingAnchor, constant: -15),
            
            instructionsText.topAnchor.constraint(equalTo: instructionsTitle.bottomAnchor, constant: 10),
            instructionsText.leadingAnchor.constraint(equalTo: instructionsView.leadingAnchor, constant: 15),
            instructionsText.trailingAnchor.constraint(equalTo: instructionsView.trailingAnchor, constant: -15),
            instructionsText.bottomAnchor.constraint(equalTo: instructionsView.bottomAnchor, constant: -15)
        ])
    }
    
    // MARK: - Actions
    
    @objc private func openSafariExtensionSettings() {
        let safariExtensionURL = URL(string: UIApplication.openSettingsURLString)!
        UIApplication.shared.open(safariExtensionURL)
    }
    
    @objc private func openSettings() {
        // Open the settings page in Safari
        if let url = URL(string: "safari-extension://xyz.chroniclesync.ChronicleSync/settings.html") {
            let safariVC = SFSafariViewController(url: url)
            present(safariVC, animated: true)
        }
    }
    
    // MARK: - Extension Status
    
    private func checkExtensionStatus() {
        // In a real app, you would check if the extension is enabled
        // For this example, we'll just update the UI
        
        // Simulating a check - in a real app, you would use SFSafariExtensionManager
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.statusLabel.text = "Extension status: Not enabled"
            self.statusLabel.textColor = .systemRed
        }
    }
}