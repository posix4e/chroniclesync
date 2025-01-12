import UIKit

class MainViewController: UIViewController {
    private let clientSection = ClientSectionView()
    private let adminPanel = AdminPanelView()
    private let adminLogin = AdminLoginView()
    private let healthCheck = HealthCheckView()
    
    private var isAdminLoggedIn: Bool = false {
        didSet {
            updateUI()
        }
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Title
        let titleLabel = UILabel()
        titleLabel.text = "ChronicleSync"
        titleLabel.font = .systemFont(ofSize: 24, weight: .bold)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(titleLabel)
        
        // Add subviews
        clientSection.translatesAutoresizingMaskIntoConstraints = false
        adminLogin.translatesAutoresizingMaskIntoConstraints = false
        adminPanel.translatesAutoresizingMaskIntoConstraints = false
        healthCheck.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(clientSection)
        view.addSubview(adminLogin)
        view.addSubview(adminPanel)
        view.addSubview(healthCheck)
        
        // Layout constraints
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            
            clientSection.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 20),
            clientSection.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            clientSection.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            adminLogin.topAnchor.constraint(equalTo: clientSection.bottomAnchor, constant: 20),
            adminLogin.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            adminLogin.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            adminPanel.topAnchor.constraint(equalTo: clientSection.bottomAnchor, constant: 20),
            adminPanel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            adminPanel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            healthCheck.topAnchor.constraint(equalTo: adminPanel.bottomAnchor, constant: 20),
            healthCheck.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            healthCheck.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            healthCheck.bottomAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -20)
        ])
        
        // Set up admin login callback
        adminLogin.onLogin = { [weak self] in
            self?.isAdminLoggedIn = true
        }
        
        updateUI()
    }
    
    private func updateUI() {
        adminLogin.isHidden = isAdminLoggedIn
        adminPanel.isHidden = !isAdminLoggedIn
    }
}