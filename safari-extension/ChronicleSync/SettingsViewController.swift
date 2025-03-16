import UIKit

class SettingsViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    
    @IBOutlet weak var tableView: UITableView!
    
    // Settings sections
    enum Section: Int, CaseIterable {
        case general
        case sync
        case privacy
        case about
        
        var title: String {
            switch self {
            case .general: return "General"
            case .sync: return "Synchronization"
            case .privacy: return "Privacy"
            case .about: return "About"
            }
        }
    }
    
    // Settings items
    struct SettingItem {
        let title: String
        let subtitle: String?
        let type: SettingType
        var isOn: Bool = false
        var action: (() -> Void)?
    }
    
    enum SettingType {
        case toggle
        case action
        case info
    }
    
    // Settings data
    var settings: [[SettingItem]] = []
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupSettings()
        setupTableView()
    }
    
    private func setupTableView() {
        tableView.delegate = self
        tableView.dataSource = self
        
        // Register cell types
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "ActionCell")
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "InfoCell")
    }
    
    private func setupSettings() {
        // General settings
        let generalSettings: [SettingItem] = [
            SettingItem(title: "Enable Extension", subtitle: "Allow ChronicleSync to run in Safari", type: .toggle, isOn: UserDefaults.standard.bool(forKey: "extensionEnabled")),
            SettingItem(title: "Dark Mode", subtitle: "Use dark theme in the extension", type: .toggle, isOn: UserDefaults.standard.bool(forKey: "darkModeEnabled"))
        ]
        
        // Sync settings
        let syncSettings: [SettingItem] = [
            SettingItem(title: "Auto Sync", subtitle: "Automatically sync browsing history", type: .toggle, isOn: UserDefaults.standard.bool(forKey: "autoSyncEnabled")),
            SettingItem(title: "Sync Frequency", subtitle: "How often to sync data", type: .action, action: { [weak self] in
                self?.showSyncFrequencyOptions()
            })
        ]
        
        // Privacy settings
        let privacySettings: [SettingItem] = [
            SettingItem(title: "Clear History", subtitle: "Delete all synced browsing history", type: .action, action: { [weak self] in
                self?.showClearHistoryConfirmation()
            }),
            SettingItem(title: "Private Browsing", subtitle: "Don't sync in private browsing mode", type: .toggle, isOn: UserDefaults.standard.bool(forKey: "privateEnabled"))
        ]
        
        // About settings
        let aboutSettings: [SettingItem] = [
            SettingItem(title: "Version", subtitle: "1.0.0", type: .info),
            SettingItem(title: "Help", subtitle: "Get support for ChronicleSync", type: .action, action: { [weak self] in
                self?.openHelpWebsite()
            })
        ]
        
        settings = [generalSettings, syncSettings, privacySettings, aboutSettings]
    }
    
    // MARK: - TableView DataSource
    
    func numberOfSections(in tableView: UITableView) -> Int {
        return Section.allCases.count
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return settings[section].count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let setting = settings[indexPath.section][indexPath.row]
        
        switch setting.type {
        case .toggle:
            let cell = UITableViewCell(style: .subtitle, reuseIdentifier: "SwitchCell")
            cell.textLabel?.text = setting.title
            cell.detailTextLabel?.text = setting.subtitle
            
            let toggle = UISwitch()
            toggle.isOn = setting.isOn
            toggle.tag = indexPath.section * 100 + indexPath.row
            toggle.addTarget(self, action: #selector(toggleChanged(_:)), for: .valueChanged)
            cell.accessoryView = toggle
            
            return cell
            
        case .action:
            let cell = tableView.dequeueReusableCell(withIdentifier: "ActionCell") ?? UITableViewCell(style: .subtitle, reuseIdentifier: "ActionCell")
            cell.textLabel?.text = setting.title
            cell.detailTextLabel?.text = setting.subtitle
            cell.accessoryType = .disclosureIndicator
            
            return cell
            
        case .info:
            let cell = tableView.dequeueReusableCell(withIdentifier: "InfoCell") ?? UITableViewCell(style: .value1, reuseIdentifier: "InfoCell")
            cell.textLabel?.text = setting.title
            cell.detailTextLabel?.text = setting.subtitle
            cell.selectionStyle = .none
            
            return cell
        }
    }
    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        return Section(rawValue: section)?.title
    }
    
    // MARK: - TableView Delegate
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        let setting = settings[indexPath.section][indexPath.row]
        if setting.type == .action {
            setting.action?()
        }
    }
    
    // MARK: - Actions
    
    @objc func toggleChanged(_ sender: UISwitch) {
        let section = sender.tag / 100
        let row = sender.tag % 100
        
        // Update the model
        settings[section][row].isOn = sender.isOn
        
        // Save to UserDefaults
        let setting = settings[section][row]
        switch setting.title {
        case "Enable Extension":
            UserDefaults.standard.set(sender.isOn, forKey: "extensionEnabled")
            if sender.isOn {
                // Open Safari to enable the extension
                openSafari()
            }
        case "Dark Mode":
            UserDefaults.standard.set(sender.isOn, forKey: "darkModeEnabled")
        case "Auto Sync":
            UserDefaults.standard.set(sender.isOn, forKey: "autoSyncEnabled")
        case "Private Browsing":
            UserDefaults.standard.set(sender.isOn, forKey: "privateEnabled")
        default:
            break
        }
    }
    
    private func showSyncFrequencyOptions() {
        let alert = UIAlertController(title: "Sync Frequency", message: "Choose how often to sync data", preferredStyle: .actionSheet)
        
        let frequencies = ["Every 15 minutes", "Every hour", "Every day", "Manual only"]
        
        for frequency in frequencies {
            alert.addAction(UIAlertAction(title: frequency, style: .default, handler: { _ in
                UserDefaults.standard.set(frequency, forKey: "syncFrequency")
                
                // Update the subtitle in the table view
                if let index = self.settings[Section.sync.rawValue].firstIndex(where: { $0.title == "Sync Frequency" }) {
                    self.settings[Section.sync.rawValue][index] = SettingItem(
                        title: "Sync Frequency",
                        subtitle: frequency,
                        type: .action,
                        action: { [weak self] in
                            self?.showSyncFrequencyOptions()
                        }
                    )
                    self.tableView.reloadRows(at: [IndexPath(row: index, section: Section.sync.rawValue)], with: .none)
                }
            }))
        }
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        
        present(alert, animated: true)
    }
    
    private func showClearHistoryConfirmation() {
        let alert = UIAlertController(title: "Clear History", message: "Are you sure you want to delete all synced browsing history? This action cannot be undone.", preferredStyle: .alert)
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        alert.addAction(UIAlertAction(title: "Clear History", style: .destructive, handler: { _ in
            // Clear history logic would go here
            // For now, just show a confirmation
            self.showToast(message: "History cleared")
        }))
        
        present(alert, animated: true)
    }
    
    private func openHelpWebsite() {
        if let url = URL(string: "https://chroniclesync.xyz/help") {
            UIApplication.shared.open(url)
        }
    }
    
    private func openSafari() {
        if let url = URL(string: "https://www.apple.com/safari/") {
            UIApplication.shared.open(url)
        }
    }
    
    private func showToast(message: String) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        present(alert, animated: true)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            alert.dismiss(animated: true)
        }
    }
}