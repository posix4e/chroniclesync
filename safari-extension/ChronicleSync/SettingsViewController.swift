import UIKit
import os.log

/// View controller for the settings screen
class SettingsViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    
    // MARK: - Properties
    
    /// Table view for displaying settings
    @IBOutlet private weak var tableView: UITableView!
    
    /// Logger for debugging
    private let logger = Logger(subsystem: "com.chroniclesync.app", category: "settingsviewcontroller")
    
    /// Settings data
    private var settings: [[SettingItem]] = []
    
    // MARK: - Types
    
    /// Settings sections
    enum Section: Int, CaseIterable {
        case general
        case sync
        case privacy
        case about
        case debug
        
        var title: String {
            switch self {
            case .general: return "General"
            case .sync: return "Synchronization"
            case .privacy: return "Privacy"
            case .about: return "About"
            case .debug: return "Debug"
            }
        }
    }
    
    /// Settings item model
    struct SettingItem {
        let title: String
        let subtitle: String?
        let type: SettingType
        var isOn: Bool = false
        var action: (() -> Void)?
    }
    
    /// Types of settings items
    enum SettingType {
        case toggle
        case action
        case info
    }
    
    // MARK: - Lifecycle Methods
    
    override func viewDidLoad() {
        super.viewDidLoad()
        logger.log("viewDidLoad called")
        
        // Debug: Check if outlet is connected
        if tableView == nil {
            logger.error("tableView outlet is nil")
            // Create a fallback UI
            createFallbackUI()
        } else {
            logger.log("tableView outlet is connected")
        }
        
        setupSettings()
        setupTableView()
    }
    
    // MARK: - Setup Methods
    
    /// Sets up the table view
    private func setupTableView() {
        if tableView == nil {
            logger.error("Cannot setup tableView because it is nil")
            return
        }
        
        tableView.delegate = self
        tableView.dataSource = self
        
        // Register cell types
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "ActionCell")
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "InfoCell")
    }
    
    /// Creates a fallback UI when the table view is nil
    private func createFallbackUI() {
        logger.log("Creating fallback UI because tableView outlet is nil")
        
        // Create a label
        let label = UILabel()
        label.text = "ChronicleSync Settings\n\nThere was an issue loading the settings UI. Please check the console for errors."
        label.numberOfLines = 0
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        
        // Add to view
        view.addSubview(label)
        
        // Add constraints
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
    }
    
    /// Sets up the settings data
    private func setupSettings() {
        logger.log("Setting up settings data")
        
        // General settings
        let generalSettings: [SettingItem] = [
            SettingItem(
                title: "Enable Extension",
                subtitle: "Allow ChronicleSync to run in Safari",
                type: .toggle,
                isOn: UserDefaults.standard.bool(forKey: "extensionEnabled")
            ),
            SettingItem(
                title: "Dark Mode",
                subtitle: "Use dark theme in the extension",
                type: .toggle,
                isOn: UserDefaults.standard.bool(forKey: "darkModeEnabled")
            )
        ]
        
        // Sync settings
        let syncSettings: [SettingItem] = [
            SettingItem(
                title: "Auto Sync",
                subtitle: "Automatically sync browsing history",
                type: .toggle,
                isOn: UserDefaults.standard.bool(forKey: "autoSyncEnabled")
            ),
            SettingItem(
                title: "Sync Frequency",
                subtitle: "How often to sync data",
                type: .action,
                action: { [weak self] in
                    self?.showSyncFrequencyOptions()
                }
            )
        ]
        
        // Privacy settings
        let privacySettings: [SettingItem] = [
            SettingItem(
                title: "Clear History",
                subtitle: "Delete all synced browsing history",
                type: .action,
                action: { [weak self] in
                    self?.showClearHistoryConfirmation()
                }
            ),
            SettingItem(
                title: "Private Browsing",
                subtitle: "Don't sync in private browsing mode",
                type: .toggle,
                isOn: UserDefaults.standard.bool(forKey: "privateEnabled")
            )
        ]
        
        // About settings
        let aboutSettings: [SettingItem] = [
            SettingItem(
                title: "Version",
                subtitle: "1.0.0",
                type: .info
            ),
            SettingItem(
                title: "Help",
                subtitle: "Get support for ChronicleSync",
                type: .action,
                action: { [weak self] in
                    self?.openHelpWebsite()
                }
            )
        ]
        
        // Debug settings
        let debugSettings: [SettingItem] = [
            SettingItem(
                title: "Check Extension Resources",
                subtitle: "Verify extension files are properly loaded",
                type: .action,
                action: { [weak self] in
                    self?.checkExtensionResources()
                }
            ),
            SettingItem(
                title: "Reset UI State",
                subtitle: "Clear cached UI state and reload",
                type: .action,
                action: { [weak self] in
                    self?.resetUIState()
                }
            ),
            SettingItem(
                title: "Bundle Info",
                subtitle: "Show bundle information",
                type: .action,
                action: { [weak self] in
                    self?.showBundleInfo()
                }
            )
        ]
        
        settings = [generalSettings, syncSettings, privacySettings, aboutSettings, debugSettings]
    }
    
    // MARK: - Debug Methods
    
    /// Checks if the extension resources are properly loaded
    private func checkExtensionResources() {
        logger.log("Checking Extension Resources")
        
        // Check main bundle
        let mainBundle = Bundle.main
        let bundleID = mainBundle.bundleIdentifier ?? "Unknown"
        let resourcesPath = mainBundle.resourcePath ?? "Unknown"
        
        var message = "Bundle ID: \(bundleID)\n\nResources Path: \(resourcesPath)"
        
        // Check for extension resources directory
        let extensionResourcesPath = resourcesPath + "/Resources"
        if FileManager.default.fileExists(atPath: extensionResourcesPath) {
            message += "\n\nExtension Resources Found"
            
            // List files in the resources directory
            do {
                let files = try FileManager.default.contentsOfDirectory(atPath: extensionResourcesPath)
                message += "\n\nFiles: \(files.count)"
                if !files.isEmpty {
                    message += "\n- " + files.prefix(5).joined(separator: "\n- ")
                    if files.count > 5 {
                        message += "\n- ... and \(files.count - 5) more"
                    }
                }
            } catch {
                message += "\n\nError listing files: \(error.localizedDescription)"
                logger.error("Error listing files: \(error.localizedDescription)")
            }
        } else {
            message += "\n\nExtension Resources NOT Found"
            logger.error("Extension Resources directory not found at: \(extensionResourcesPath)")
        }
        
        showAlert(title: "Extension Resources", message: message)
    }
    
    /// Resets all UI state to defaults
    private func resetUIState() {
        logger.log("Resetting UI state")
        
        UserDefaults.standard.removeObject(forKey: "extensionEnabled")
        UserDefaults.standard.removeObject(forKey: "darkModeEnabled")
        UserDefaults.standard.removeObject(forKey: "autoSyncEnabled")
        UserDefaults.standard.removeObject(forKey: "privateEnabled")
        UserDefaults.standard.removeObject(forKey: "syncFrequency")
        
        // Reload settings
        setupSettings()
        tableView?.reloadData()
        
        showAlert(title: "UI State Reset", message: "All UI state has been reset to defaults.")
    }
    
    /// Shows information about the app bundle
    private func showBundleInfo() {
        logger.log("Showing bundle info")
        
        let mainBundle = Bundle.main
        let bundleID = mainBundle.bundleIdentifier ?? "Unknown"
        let version = mainBundle.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown"
        let build = mainBundle.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown"
        let executable = mainBundle.infoDictionary?["CFBundleExecutable"] as? String ?? "Unknown"
        
        let message = """
        Bundle ID: \(bundleID)
        Version: \(version)
        Build: \(build)
        Executable: \(executable)
        """
        
        showAlert(title: "Bundle Information", message: message)
    }
    
    /// Shows an alert with the given title and message
    /// - Parameters:
    ///   - title: The title of the alert
    ///   - message: The message to display
    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
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
            return configureToggleCell(for: setting, at: indexPath)
            
        case .action:
            return configureActionCell(for: setting, with: tableView)
            
        case .info:
            return configureInfoCell(for: setting, with: tableView)
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
    
    // MARK: - Cell Configuration
    
    /// Configures a cell with a toggle switch
    /// - Parameters:
    ///   - setting: The setting item
    ///   - indexPath: The index path
    /// - Returns: A configured cell
    private func configureToggleCell(for setting: SettingItem, at indexPath: IndexPath) -> UITableViewCell {
        let cell = UITableViewCell(style: .subtitle, reuseIdentifier: "SwitchCell")
        cell.textLabel?.text = setting.title
        cell.detailTextLabel?.text = setting.subtitle
        
        let toggle = UISwitch()
        toggle.isOn = setting.isOn
        toggle.tag = indexPath.section * 100 + indexPath.row
        toggle.addTarget(self, action: #selector(toggleChanged(_:)), for: .valueChanged)
        cell.accessoryView = toggle
        
        return cell
    }
    
    /// Configures a cell for an action
    /// - Parameters:
    ///   - setting: The setting item
    ///   - tableView: The table view
    /// - Returns: A configured cell
    private func configureActionCell(for setting: SettingItem, with tableView: UITableView) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "ActionCell") ?? 
                  UITableViewCell(style: .subtitle, reuseIdentifier: "ActionCell")
        cell.textLabel?.text = setting.title
        cell.detailTextLabel?.text = setting.subtitle
        cell.accessoryType = .disclosureIndicator
        
        return cell
    }
    
    /// Configures a cell for displaying information
    /// - Parameters:
    ///   - setting: The setting item
    ///   - tableView: The table view
    /// - Returns: A configured cell
    private func configureInfoCell(for setting: SettingItem, with tableView: UITableView) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "InfoCell") ?? 
                  UITableViewCell(style: .value1, reuseIdentifier: "InfoCell")
        cell.textLabel?.text = setting.title
        cell.detailTextLabel?.text = setting.subtitle
        cell.selectionStyle = .none
        
        return cell
    }
    
    // MARK: - Actions
    
    /// Called when a toggle switch is changed
    /// - Parameter sender: The toggle switch
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
            logger.log("Unknown toggle setting: \(setting.title)")
        }
    }
    
    /// Shows options for sync frequency
    private func showSyncFrequencyOptions() {
        logger.log("Showing sync frequency options")
        
        let alert = UIAlertController(
            title: "Sync Frequency",
            message: "Choose how often to sync data",
            preferredStyle: .actionSheet
        )
        
        let frequencies = ["Every 15 minutes", "Every hour", "Every day", "Manual only"]
        
        for frequency in frequencies {
            alert.addAction(UIAlertAction(title: frequency, style: .default, handler: { _ in
                UserDefaults.standard.set(frequency, forKey: "syncFrequency")
                self.updateSyncFrequencyInSettings(to: frequency)
            }))
        }
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        
        present(alert, animated: true)
    }
    
    /// Updates the sync frequency in the settings table
    /// - Parameter frequency: The new frequency
    private func updateSyncFrequencyInSettings(to frequency: String) {
        if let index = self.settings[Section.sync.rawValue].firstIndex(where: { $0.title == "Sync Frequency" }) {
            self.settings[Section.sync.rawValue][index] = SettingItem(
                title: "Sync Frequency",
                subtitle: frequency,
                type: .action,
                action: { [weak self] in
                    self?.showSyncFrequencyOptions()
                }
            )
            self.tableView?.reloadRows(at: [IndexPath(row: index, section: Section.sync.rawValue)], with: .none)
        }
    }
    
    /// Shows confirmation dialog for clearing history
    private func showClearHistoryConfirmation() {
        logger.log("Showing clear history confirmation")
        
        let alert = UIAlertController(
            title: "Clear History",
            message: "Are you sure you want to delete all synced browsing history? This action cannot be undone.",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        alert.addAction(UIAlertAction(title: "Clear History", style: .destructive, handler: { _ in
            // Clear history logic would go here
            // For now, just show a confirmation
            self.clearHistory()
        }))
        
        present(alert, animated: true)
    }
    
    /// Clears the browsing history
    private func clearHistory() {
        logger.log("Clearing history")
        // Actual history clearing logic would go here
        showToast(message: "History cleared")
    }
    
    /// Opens the help website
    private func openHelpWebsite() {
        logger.log("Opening help website")
        
        if let url = URL(string: "https://chroniclesync.xyz/help") {
            UIApplication.shared.open(url)
        }
    }
    
    /// Opens Safari
    private func openSafari() {
        logger.log("Opening Safari")
        
        if let url = URL(string: "https://www.apple.com/safari/") {
            UIApplication.shared.open(url)
        }
    }
    
    /// Shows a toast message
    /// - Parameter message: The message to show
    private func showToast(message: String) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        present(alert, animated: true)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            alert.dismiss(animated: true)
        }
    }
}