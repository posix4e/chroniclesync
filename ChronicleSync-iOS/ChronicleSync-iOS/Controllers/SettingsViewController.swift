import UIKit
import WebKit

class SettingsViewController: UIViewController {
    
    private let tableView = UITableView(frame: .zero, style: .grouped)
    private let apiKeyTextField = UITextField()
    private let syncToggle = UISwitch()
    private let saveButton = UIButton(type: .system)
    
    // Settings sections and options
    private enum Section: Int, CaseIterable {
        case account
        case sync
        case about
        
        var title: String {
            switch self {
            case .account: return "Account"
            case .sync: return "Sync Settings"
            case .about: return "About"
            }
        }
    }
    
    private enum AccountOption: Int, CaseIterable {
        case apiKey
        
        var title: String {
            switch self {
            case .apiKey: return "API Key"
            }
        }
    }
    
    private enum SyncOption: Int, CaseIterable {
        case enableSync
        case syncFrequency
        
        var title: String {
            switch self {
            case .enableSync: return "Enable Sync"
            case .syncFrequency: return "Sync Frequency"
            }
        }
    }
    
    private enum AboutOption: Int, CaseIterable {
        case version
        case privacy
        
        var title: String {
            switch self {
            case .version: return "Version"
            case .privacy: return "Privacy Policy"
            }
        }
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        loadSettings()
    }
    
    private func setupUI() {
        title = "Settings"
        view.backgroundColor = .systemBackground
        
        // Table View
        tableView.delegate = self
        tableView.dataSource = self
        tableView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(tableView)
        
        // Save Button
        saveButton.setTitle("Save Settings", for: .normal)
        saveButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
        saveButton.backgroundColor = .systemBlue
        saveButton.setTitleColor(.white, for: .normal)
        saveButton.layer.cornerRadius = 10
        saveButton.translatesAutoresizingMaskIntoConstraints = false
        saveButton.addTarget(self, action: #selector(saveSettings), for: .touchUpInside)
        view.addSubview(saveButton)
        
        // Constraints
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: saveButton.topAnchor, constant: -20),
            
            saveButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            saveButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            saveButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -20),
            saveButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }
    
    private func loadSettings() {
        // Load settings from UserDefaults
        let defaults = UserDefaults.standard
        apiKeyTextField.text = defaults.string(forKey: "chronicleSync_apiKey") ?? ""
        syncToggle.isOn = defaults.bool(forKey: "chronicleSync_enableSync")
    }
    
    @objc private func saveSettings() {
        // Save settings to UserDefaults
        let defaults = UserDefaults.standard
        defaults.set(apiKeyTextField.text, forKey: "chronicleSync_apiKey")
        defaults.set(syncToggle.isOn, forKey: "chronicleSync_enableSync")
        
        // Share settings with Safari extension
        let sharedDefaults = UserDefaults(suiteName: "group.xyz.chroniclesync.shared")
        sharedDefaults?.set(apiKeyTextField.text, forKey: "chronicleSync_apiKey")
        sharedDefaults?.set(syncToggle.isOn, forKey: "chronicleSync_enableSync")
        
        // Show success alert
        let alert = UIAlertController(title: "Settings Saved", message: "Your settings have been saved successfully.", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

extension SettingsViewController: UITableViewDelegate, UITableViewDataSource {
    func numberOfSections(in tableView: UITableView) -> Int {
        return Section.allCases.count
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        guard let sectionType = Section(rawValue: section) else { return 0 }
        
        switch sectionType {
        case .account: return AccountOption.allCases.count
        case .sync: return SyncOption.allCases.count
        case .about: return AboutOption.allCases.count
        }
    }
    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        guard let sectionType = Section(rawValue: section) else { return nil }
        return sectionType.title
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = UITableViewCell(style: .value1, reuseIdentifier: "SettingsCell")
        guard let sectionType = Section(rawValue: indexPath.section) else { return cell }
        
        switch sectionType {
        case .account:
            guard let option = AccountOption(rawValue: indexPath.row) else { return cell }
            cell.textLabel?.text = option.title
            
            switch option {
            case .apiKey:
                apiKeyTextField.placeholder = "Enter API Key"
                apiKeyTextField.borderStyle = .none
                apiKeyTextField.textAlignment = .right
                apiKeyTextField.frame = CGRect(x: 0, y: 0, width: 200, height: 40)
                cell.accessoryView = apiKeyTextField
            }
            
        case .sync:
            guard let option = SyncOption(rawValue: indexPath.row) else { return cell }
            cell.textLabel?.text = option.title
            
            switch option {
            case .enableSync:
                cell.accessoryView = syncToggle
            case .syncFrequency:
                cell.detailTextLabel?.text = "Every 30 minutes"
                cell.accessoryType = .disclosureIndicator
            }
            
        case .about:
            guard let option = AboutOption(rawValue: indexPath.row) else { return cell }
            cell.textLabel?.text = option.title
            
            switch option {
            case .version:
                cell.detailTextLabel?.text = "1.0.0"
            case .privacy:
                cell.accessoryType = .disclosureIndicator
            }
        }
        
        return cell
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        guard let sectionType = Section(rawValue: indexPath.section) else { return }
        
        switch sectionType {
        case .sync:
            if let option = SyncOption(rawValue: indexPath.row), option == .syncFrequency {
                // Show sync frequency options
                let alert = UIAlertController(title: "Sync Frequency", message: "Choose how often to sync", preferredStyle: .actionSheet)
                alert.addAction(UIAlertAction(title: "Every 15 minutes", style: .default))
                alert.addAction(UIAlertAction(title: "Every 30 minutes", style: .default))
                alert.addAction(UIAlertAction(title: "Every hour", style: .default))
                alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
                present(alert, animated: true)
            }
        case .about:
            if let option = AboutOption(rawValue: indexPath.row), option == .privacy {
                // Show privacy policy
                let webView = WKWebView(frame: view.bounds)
                let privacyVC = UIViewController()
                privacyVC.view = webView
                privacyVC.title = "Privacy Policy"
                
                if let url = URL(string: "https://chroniclesync.xyz/privacy") {
                    let request = URLRequest(url: url)
                    webView.load(request)
                }
                
                navigationController?.pushViewController(privacyVC, animated: true)
            }
        default:
            break
        }
    }
}