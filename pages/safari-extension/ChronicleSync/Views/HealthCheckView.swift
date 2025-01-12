import UIKit

class HealthCheckView: UIView {
    private let titleLabel = UILabel()
    private let statusLabel = UILabel()
    private let checkButton = UIButton(type: .system)
    
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
        titleLabel.text = "System Health"
        titleLabel.font = .systemFont(ofSize: 20, weight: .semibold)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(titleLabel)
        
        // Status
        statusLabel.text = "Status: Unknown"
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(statusLabel)
        
        // Check button
        checkButton.setTitle("Check Health", for: .normal)
        checkButton.addTarget(self, action: #selector(checkButtonTapped), for: .touchUpInside)
        checkButton.translatesAutoresizingMaskIntoConstraints = false
        addSubview(checkButton)
        
        // Layout
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: topAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            
            statusLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            statusLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            
            checkButton.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 12),
            checkButton.leadingAnchor.constraint(equalTo: leadingAnchor),
            checkButton.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }
    
    @objc private func checkButtonTapped() {
        checkHealth()
    }
    
    private func checkHealth() {
        statusLabel.text = "Status: Checking..."
        checkButton.isEnabled = false
        
        // In a real app, you would check the system health here
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
            self?.statusLabel.text = "Status: Healthy"
            self?.checkButton.isEnabled = true
        }
    }
}