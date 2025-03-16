import UIKit

class SettingsViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    
    @IBOutlet weak var tableView: UITableView!
    
    // Settings sections
    enum Section: Int, CaseIterable {
        case general
        case about
        
        var title: String {
            switch self {
            case .general: return "General"
            case .about: return "About"
            }
        }
    }
    
    // Settings options
    enum GeneralOption: Int, CaseIterable {
        case syncFrequency
        case dataUsage
        case notifications
        
        var title: String {
            switch self {
            case .syncFrequency: return "Sync Frequency"
            case .dataUsage: return "Data Usage"
            case .notifications: return "Notifications"
            }
        }
        
        var detail: String {
            switch self {
            case .syncFrequency: return "Automatic"
            case .dataUsage: return "Wi-Fi Only"
            case .notifications: return "On"
            }
        }
    }
    
    enum AboutOption: Int, CaseIterable {
        case version
        case privacy
        case terms
        
        var title: String {
            switch self {
            case .version: return "Version"
            case .privacy: return "Privacy Policy"
            case .terms: return "Terms of Service"
            }
        }
        
        var detail: String {
            switch self {
            case .version: return "1.0.0"
            case .privacy: return ""
            case .terms: return ""
            }
        }
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Set up table view
        tableView.delegate = self
        tableView.dataSource = self
        tableView.tableFooterView = UIView()
    }
    
    // MARK: - UITableViewDataSource
    
    func numberOfSections(in tableView: UITableView) -> Int {
        return Section.allCases.count
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        guard let sectionType = Section(rawValue: section) else { return 0 }
        
        switch sectionType {
        case .general:
            return GeneralOption.allCases.count
        case .about:
            return AboutOption.allCases.count
        }
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "SettingCell", for: indexPath)
        
        guard let sectionType = Section(rawValue: indexPath.section) else { return cell }
        
        switch sectionType {
        case .general:
            if let option = GeneralOption(rawValue: indexPath.row) {
                cell.textLabel?.text = option.title
                cell.detailTextLabel?.text = option.detail
            }
        case .about:
            if let option = AboutOption(rawValue: indexPath.row) {
                cell.textLabel?.text = option.title
                cell.detailTextLabel?.text = option.detail
            }
        }
        
        return cell
    }
    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        guard let sectionType = Section(rawValue: section) else { return nil }
        return sectionType.title
    }
    
    // MARK: - UITableViewDelegate
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        guard let sectionType = Section(rawValue: indexPath.section) else { return }
        
        switch sectionType {
        case .general:
            if let option = GeneralOption(rawValue: indexPath.row) {
                handleGeneralOptionTap(option)
            }
        case .about:
            if let option = AboutOption(rawValue: indexPath.row) {
                handleAboutOptionTap(option)
            }
        }
    }
    
    // MARK: - Option Handlers
    
    private func handleGeneralOptionTap(_ option: GeneralOption) {
        switch option {
        case .syncFrequency:
            showSyncFrequencyOptions()
        case .dataUsage:
            showDataUsageOptions()
        case .notifications:
            toggleNotifications()
        }
    }
    
    private func handleAboutOptionTap(_ option: AboutOption) {
        switch option {
        case .version:
            // Do nothing for version
            break
        case .privacy:
            openPrivacyPolicy()
        case .terms:
            openTermsOfService()
        }
    }
    
    // MARK: - Helper Methods
    
    private func showSyncFrequencyOptions() {
        let alert = UIAlertController(title: "Sync Frequency", message: "Choose how often to sync your data", preferredStyle: .actionSheet)
        
        alert.addAction(UIAlertAction(title: "Automatic", style: .default, handler: nil))
        alert.addAction(UIAlertAction(title: "Hourly", style: .default, handler: nil))
        alert.addAction(UIAlertAction(title: "Daily", style: .default, handler: nil))
        alert.addAction(UIAlertAction(title: "Weekly", style: .default, handler: nil))
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        
        present(alert, animated: true)
    }
    
    private func showDataUsageOptions() {
        let alert = UIAlertController(title: "Data Usage", message: "Choose when to sync your data", preferredStyle: .actionSheet)
        
        alert.addAction(UIAlertAction(title: "Wi-Fi Only", style: .default, handler: nil))
        alert.addAction(UIAlertAction(title: "Wi-Fi & Cellular", style: .default, handler: nil))
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        
        present(alert, animated: true)
    }
    
    private func toggleNotifications() {
        // Toggle notifications logic would go here
        let alert = UIAlertController(title: "Notifications", message: "Notifications have been toggled", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        present(alert, animated: true)
    }
    
    private func openPrivacyPolicy() {
        if let url = URL(string: "https://chroniclesync.xyz/privacy") {
            UIApplication.shared.open(url)
        }
    }
    
    private func openTermsOfService() {
        if let url = URL(string: "https://chroniclesync.xyz/terms") {
            UIApplication.shared.open(url)
        }
    }
}