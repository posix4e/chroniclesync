import UIKit
import SafariServices
import SafariServices.SFSafariApplication

class ViewController: UIViewController {
    
    @IBOutlet weak var enableExtensionButton: UIButton!
    @IBOutlet weak var openSafariButton: UIButton!
    @IBOutlet weak var statusLabel: UILabel!
    
    // Flag to determine if we're in test mode
    private var isTestMode: Bool = false
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Check if we're running in test mode
        if ProcessInfo.processInfo.arguments.contains("-UITestMode") {
            isTestMode = true
        }
        
        setupUI()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        updateExtensionStatus()
        
        // If in test mode, show the test settings screen after a short delay
        if isTestMode {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                self?.showTestSettingsScreen()
            }
        }
    }
    
    private func setupUI() {
        title = "ChronicleSync"
        
        enableExtensionButton.layer.cornerRadius = 8
        enableExtensionButton.backgroundColor = .systemBlue
        enableExtensionButton.setTitleColor(.white, for: .normal)
        
        openSafariButton.layer.cornerRadius = 8
        openSafariButton.backgroundColor = .systemGray5
        openSafariButton.setTitleColor(.systemBlue, for: .normal)
        
        // Add test mode indicator if in test mode
        if isTestMode {
            let testLabel = UILabel()
            testLabel.text = "TEST MODE ACTIVE"
            testLabel.textColor = .systemRed
            testLabel.font = UIFont.boldSystemFont(ofSize: 16)
            testLabel.textAlignment = .center
            testLabel.accessibilityIdentifier = "testModeLabel"
            testLabel.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(testLabel)
            
            NSLayoutConstraint.activate([
                testLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 10),
                testLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
                testLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
                testLabel.heightAnchor.constraint(equalToConstant: 30)
            ])
        }
    }
    
    private func showTestSettingsScreen() {
        // Create a test settings view controller
        let testSettingsVC = UIViewController()
        testSettingsVC.view.backgroundColor = .systemBackground
        testSettingsVC.title = "Test Settings"
        
        // Create a stack view for the test settings
        let stackView = UIStackView()
        stackView.axis = .vertical
        stackView.spacing = 20
        stackView.alignment = .center
        stackView.translatesAutoresizingMaskIntoConstraints = false
        testSettingsVC.view.addSubview(stackView)
        
        // Add a label to identify this as the test settings screen
        let titleLabel = UILabel()
        titleLabel.text = "ChronicleSync Extension Test"
        titleLabel.font = UIFont.boldSystemFont(ofSize: 20)
        titleLabel.textAlignment = .center
        titleLabel.accessibilityIdentifier = "testSettingsTitle"
        
        // Add a status label
        let statusLabel = UILabel()
        statusLabel.text = "Extension Test Mode Active"
        statusLabel.textColor = .systemGreen
        statusLabel.font = UIFont.systemFont(ofSize: 16)
        statusLabel.textAlignment = .center
        statusLabel.accessibilityIdentifier = "testSettingsStatus"
        
        // Add a button to simulate extension activation
        let activateButton = UIButton(type: .system)
        activateButton.setTitle("Simulate Extension Activation", for: .normal)
        activateButton.backgroundColor = .systemBlue
        activateButton.setTitleColor(.white, for: .normal)
        activateButton.layer.cornerRadius = 8
        activateButton.accessibilityIdentifier = "simulateActivationButton"
        activateButton.addTarget(self, action: #selector(simulateExtensionActivation), for: .touchUpInside)
        
        // Add elements to the stack view
        stackView.addArrangedSubview(titleLabel)
        stackView.addArrangedSubview(statusLabel)
        stackView.addArrangedSubview(activateButton)
        
        // Set constraints for the stack view
        NSLayoutConstraint.activate([
            stackView.centerXAnchor.constraint(equalTo: testSettingsVC.view.centerXAnchor),
            stackView.centerYAnchor.constraint(equalTo: testSettingsVC.view.centerYAnchor),
            stackView.leadingAnchor.constraint(greaterThanOrEqualTo: testSettingsVC.view.leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(lessThanOrEqualTo: testSettingsVC.view.trailingAnchor, constant: -20),
            activateButton.widthAnchor.constraint(equalToConstant: 250),
            activateButton.heightAnchor.constraint(equalToConstant: 44)
        ])
        
        // Present the test settings screen
        let navController = UINavigationController(rootViewController: testSettingsVC)
        navController.modalPresentationStyle = .fullScreen
        present(navController, animated: true)
    }
    
    @objc private func simulateExtensionActivation() {
        // Simulate the extension being activated
        let alert = UIAlertController(title: "Extension Activated", message: "The Safari extension has been activated in test mode", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    private func updateExtensionStatus() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: getExtensionBundleIdentifier()) { [weak self] (state: SFSafariExtensionState?, error: Error?) in
            DispatchQueue.main.async {
                if let state = state, state.isEnabled {
                    self?.statusLabel.text = "Extension is enabled"
                    self?.statusLabel.textColor = .systemGreen
                    self?.enableExtensionButton.setTitle("Extension Settings", for: .normal)
                } else {
                    self?.statusLabel.text = "Extension is disabled"
                    self?.statusLabel.textColor = .systemRed
                    self?.enableExtensionButton.setTitle("Enable Extension", for: .normal)
                }
            }
        }
    }
    
    @IBAction func enableExtensionTapped(_ sender: Any) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: getExtensionBundleIdentifier()) { [weak self] (error: Error?) in
            DispatchQueue.main.async {
                if let error = error {
                    let alert = UIAlertController(title: "Error", message: "Could not open Safari extension preferences: \(error.localizedDescription)", preferredStyle: .alert)
                    alert.addAction(UIAlertAction(title: "OK", style: .default))
                    self?.present(alert, animated: true)
                }
                self?.updateExtensionStatus()
            }
        }
    }
    
    @IBAction func openSafariTapped(_ sender: Any) {
        if let url = URL(string: "https://www.chroniclesync.xyz") {
            UIApplication.shared.open(url)
        }
    }
    
    private func getExtensionBundleIdentifier() -> String {
        // Try to get the bundle ID from environment variables first
        if let appID = Bundle.main.infoDictionary?["APPLE_APP_ID"] as? String {
            return "\(appID).extension"
        }
        
        // Default bundle ID
        return "xyz.chroniclesync.app.extension"
    }
}