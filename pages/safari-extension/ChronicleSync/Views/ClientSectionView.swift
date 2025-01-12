import UIKit

class ClientSectionView: UIView {
    private let titleLabel = UILabel()
    private let statusLabel = UILabel()
    private let syncButton = UIButton(type: .system)
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupUI()
    }
    
    private func setupUI() {
        // Title
        titleLabel.text = "Client Section"
        titleLabel.font = .systemFont(ofSize: 20, weight: .semibold)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(titleLabel)
        
        // Status
        statusLabel.text = "Not synced"
        statusLabel.textColor = .secondaryLabel
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(statusLabel)
        
        // Sync button
        syncButton.setTitle("Sync History", for: .normal)
        syncButton.addTarget(self, action: #selector(syncButtonTapped), for: .touchUpInside)
        syncButton.translatesAutoresizingMaskIntoConstraints = false
        addSubview(syncButton)
        
        // Layout
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: topAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            
            statusLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            statusLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            
            syncButton.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 12),
            syncButton.leadingAnchor.constraint(equalTo: leadingAnchor),
            syncButton.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }
    
    @objc private func syncButtonTapped() {
        // Send message to Safari extension
        let userInfo = ["action": "syncHistory"]
        NotificationCenter.default.post(name: .init("SafariExtensionMessage"), object: nil, userInfo: userInfo)
        
        // Update UI
        statusLabel.text = "Syncing..."
        syncButton.isEnabled = false
    }
    
    func updateSyncStatus(status: String) {
        statusLabel.text = status
        syncButton.isEnabled = true
    }
}