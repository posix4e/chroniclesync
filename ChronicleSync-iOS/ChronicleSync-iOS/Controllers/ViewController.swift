import UIKit
import SafariServices

class ViewController: UIViewController {
    
    private let enableExtensionButton = UIButton(type: .system)
    private let settingsButton = UIButton(type: .system)
    private let titleLabel = UILabel()
    private let descriptionLabel = UILabel()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Title Label
        titleLabel.text = "ChronicleSync"
        titleLabel.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        titleLabel.textAlignment = .center
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(titleLabel)
        
        // Description Label
        descriptionLabel.text = "Sync your browsing history across devices"
        descriptionLabel.font = UIFont.systemFont(ofSize: 16)
        descriptionLabel.textAlignment = .center
        descriptionLabel.numberOfLines = 0
        descriptionLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(descriptionLabel)
        
        // Enable Extension Button
        enableExtensionButton.setTitle("Enable Safari Extension", for: .normal)
        enableExtensionButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
        enableExtensionButton.backgroundColor = .systemBlue
        enableExtensionButton.setTitleColor(.white, for: .normal)
        enableExtensionButton.layer.cornerRadius = 10
        enableExtensionButton.translatesAutoresizingMaskIntoConstraints = false
        enableExtensionButton.addTarget(self, action: #selector(enableExtensionTapped), for: .touchUpInside)
        view.addSubview(enableExtensionButton)
        
        // Settings Button
        settingsButton.setTitle("Settings", for: .normal)
        settingsButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
        settingsButton.backgroundColor = .systemGray5
        settingsButton.setTitleColor(.systemBlue, for: .normal)
        settingsButton.layer.cornerRadius = 10
        settingsButton.translatesAutoresizingMaskIntoConstraints = false
        settingsButton.addTarget(self, action: #selector(settingsTapped), for: .touchUpInside)
        view.addSubview(settingsButton)
        
        // Constraints
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 40),
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            descriptionLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 20),
            descriptionLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            descriptionLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            descriptionLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            enableExtensionButton.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            enableExtensionButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            enableExtensionButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            enableExtensionButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40),
            enableExtensionButton.heightAnchor.constraint(equalToConstant: 50),
            
            settingsButton.topAnchor.constraint(equalTo: enableExtensionButton.bottomAnchor, constant: 20),
            settingsButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            settingsButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            settingsButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40),
            settingsButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }
    
    @objc private func enableExtensionTapped() {
        // Open Safari Extension Settings
        let safariExtensionViewController = SFSafariExtensionManagerViewController()
        safariExtensionViewController.delegate = self
        present(safariExtensionViewController, animated: true, completion: nil)
    }
    
    @objc private func settingsTapped() {
        // Navigate to Settings View Controller
        let settingsVC = SettingsViewController()
        navigationController?.pushViewController(settingsVC, animated: true)
    }
}

extension ViewController: SFSafariExtensionManagerViewControllerDelegate {
    func safariExtensionManagerViewControllerDidFinish(_ viewController: SFSafariExtensionManagerViewController) {
        viewController.dismiss(animated: true, completion: nil)
    }
}