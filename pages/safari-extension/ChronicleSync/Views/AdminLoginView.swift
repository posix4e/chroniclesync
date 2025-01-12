import UIKit

class AdminLoginView: UIView {
    private let titleLabel = UILabel()
    private let passwordField = UITextField()
    private let loginButton = UIButton(type: .system)
    
    var onLogin: (() -> Void)?
    
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
        titleLabel.text = "Admin Login"
        titleLabel.font = .systemFont(ofSize: 20, weight: .semibold)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(titleLabel)
        
        // Password field
        passwordField.placeholder = "Enter admin password"
        passwordField.isSecureTextEntry = true
        passwordField.borderStyle = .roundedRect
        passwordField.translatesAutoresizingMaskIntoConstraints = false
        addSubview(passwordField)
        
        // Login button
        loginButton.setTitle("Login", for: .normal)
        loginButton.addTarget(self, action: #selector(loginButtonTapped), for: .touchUpInside)
        loginButton.translatesAutoresizingMaskIntoConstraints = false
        addSubview(loginButton)
        
        // Layout
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: topAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            
            passwordField.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 12),
            passwordField.leadingAnchor.constraint(equalTo: leadingAnchor),
            passwordField.trailingAnchor.constraint(equalTo: trailingAnchor),
            
            loginButton.topAnchor.constraint(equalTo: passwordField.bottomAnchor, constant: 12),
            loginButton.leadingAnchor.constraint(equalTo: leadingAnchor),
            loginButton.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }
    
    @objc private func loginButtonTapped() {
        // In a real app, you would validate the password here
        onLogin?()
    }
}