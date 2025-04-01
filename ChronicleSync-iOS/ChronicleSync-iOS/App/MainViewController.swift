import UIKit
import SafariServices

class MainViewController: UIViewController {
    private let storageAdapter = StorageAdapter()
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "ChronicleSync"
        label.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private let statusLabel: UILabel = {
        let label = UILabel()
        label.text = "Loading status..."
        label.font = UIFont.systemFont(ofSize: 16)
        label.textAlignment = .center
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private let syncButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Sync Now", for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        button.backgroundColor = UIColor(red: 0, green: 0.478, blue: 0.8, alpha: 1)
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 8
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()
    
    private let settingsButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Settings", for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        button.backgroundColor = UIColor(red: 0.9, green: 0.9, blue: 0.9, alpha: 1)
        button.setTitleColor(.black, for: .normal)
        button.layer.cornerRadius = 8
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()
    
    private let historyButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("View History", for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        button.backgroundColor = UIColor(red: 0.9, green: 0.9, blue: 0.9, alpha: 1)
        button.setTitleColor(.black, for: .normal)
        button.layer.cornerRadius = 8
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupActions()
        updateStatus()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        updateStatus()
    }
    
    private func setupUI() {
        view.backgroundColor = .white
        
        view.addSubview(titleLabel)
        view.addSubview(statusLabel)
        view.addSubview(syncButton)
        view.addSubview(settingsButton)
        view.addSubview(historyButton)
        
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            statusLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 20),
            statusLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            statusLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            syncButton.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 30),
            syncButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            syncButton.widthAnchor.constraint(equalToConstant: 200),
            syncButton.heightAnchor.constraint(equalToConstant: 44),
            
            settingsButton.topAnchor.constraint(equalTo: syncButton.bottomAnchor, constant: 20),
            settingsButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            settingsButton.widthAnchor.constraint(equalToConstant: 200),
            settingsButton.heightAnchor.constraint(equalToConstant: 44),
            
            historyButton.topAnchor.constraint(equalTo: settingsButton.bottomAnchor, constant: 20),
            historyButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            historyButton.widthAnchor.constraint(equalToConstant: 200),
            historyButton.heightAnchor.constraint(equalToConstant: 44)
        ])
    }
    
    private func setupActions() {
        syncButton.addTarget(self, action: #selector(syncNowTapped), for: .touchUpInside)
        settingsButton.addTarget(self, action: #selector(settingsTapped), for: .touchUpInside)
        historyButton.addTarget(self, action: #selector(historyTapped), for: .touchUpInside)
    }
    
    private func updateStatus() {
        let userDefaults = UserDefaults(suiteName: "group.xyz.chroniclesync")
        
        if let lastSyncTime = userDefaults?.double(forKey: "lastSyncTime"), lastSyncTime > 0 {
            let date = Date(timeIntervalSince1970: lastSyncTime / 1000)
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .medium
            dateFormatter.timeStyle = .short
            
            let entriesCount = storageAdapter.getEntries().count
            
            statusLabel.text = "Last sync: \(dateFormatter.string(from: date))\nEntries: \(entriesCount)"
        } else {
            statusLabel.text = "No sync performed yet"
        }
    }
    
    @objc private func syncNowTapped() {
        statusLabel.text = "Syncing..."
        
        // Perform sync
        DispatchQueue.global(qos: .background).async {
            // Get unsynced entries
            let unsyncedEntries = self.storageAdapter.getUnsyncedEntries()
            
            // In a real implementation, we would send these to the server
            // For now, just mark them as synced
            for entry in unsyncedEntries {
                if let visitId = entry["visitId"] as? String {
                    self.storageAdapter.markAsSynced(visitId: visitId)
                }
            }
            
            // Update last sync time
            let userDefaults = UserDefaults(suiteName: "group.xyz.chroniclesync")
            userDefaults?.set(Date().timeIntervalSince1970 * 1000, forKey: "lastSyncTime")
            
            DispatchQueue.main.async {
                self.updateStatus()
            }
        }
    }
    
    @objc private func settingsTapped() {
        let settingsVC = SettingsViewController()
        navigationController?.pushViewController(settingsVC, animated: true)
    }
    
    @objc private func historyTapped() {
        let historyVC = HistoryViewController()
        navigationController?.pushViewController(historyVC, animated: true)
    }
}

// Placeholder for Settings View Controller
class SettingsViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        title = "Settings"
        
        // In a real implementation, this would have settings for client ID, etc.
    }
}

// Placeholder for History View Controller
class HistoryViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    private let storageAdapter = StorageAdapter()
    private var historyEntries: [[String: Any]] = []
    
    private let tableView: UITableView = {
        let tableView = UITableView()
        tableView.translatesAutoresizingMaskIntoConstraints = false
        return tableView
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        title = "History"
        
        setupTableView()
        loadHistory()
    }
    
    private func setupTableView() {
        view.addSubview(tableView)
        
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
        ])
        
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "HistoryCell")
    }
    
    private func loadHistory() {
        historyEntries = storageAdapter.getEntries()
        tableView.reloadData()
    }
    
    // MARK: - UITableViewDataSource
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return historyEntries.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "HistoryCell", for: indexPath)
        
        let entry = historyEntries[indexPath.row]
        cell.textLabel?.text = entry["title"] as? String ?? "No Title"
        cell.detailTextLabel?.text = entry["url"] as? String
        
        return cell
    }
    
    // MARK: - UITableViewDelegate
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        if let urlString = historyEntries[indexPath.row]["url"] as? String,
           let url = URL(string: urlString) {
            let safariVC = SFSafariViewController(url: url)
            present(safariVC, animated: true)
        }
    }
}