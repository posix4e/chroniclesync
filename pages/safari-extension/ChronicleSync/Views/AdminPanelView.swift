import UIKit

class AdminPanelView: UIView {
    private let titleLabel = UILabel()
    private let statsLabel = UILabel()
    private let refreshButton = UIButton(type: .system)
    
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
        titleLabel.text = "Admin Panel"
        titleLabel.font = .systemFont(ofSize: 20, weight: .semibold)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(titleLabel)
        
        // Stats
        statsLabel.text = "Loading stats..."
        statsLabel.numberOfLines = 0
        statsLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(statsLabel)
        
        // Refresh button
        refreshButton.setTitle("Refresh Stats", for: .normal)
        refreshButton.addTarget(self, action: #selector(refreshButtonTapped), for: .touchUpInside)
        refreshButton.translatesAutoresizingMaskIntoConstraints = false
        addSubview(refreshButton)
        
        // Layout
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: topAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            
            statsLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 12),
            statsLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            statsLabel.trailingAnchor.constraint(equalTo: trailingAnchor),
            
            refreshButton.topAnchor.constraint(equalTo: statsLabel.bottomAnchor, constant: 12),
            refreshButton.leadingAnchor.constraint(equalTo: leadingAnchor),
            refreshButton.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
        
        loadStats()
    }
    
    @objc private func refreshButtonTapped() {
        loadStats()
    }
    
    private func loadStats() {
        // In a real app, you would fetch stats from your backend
        statsLabel.text = "Total users: --\nSync operations: --\nLast sync: --"
    }
}