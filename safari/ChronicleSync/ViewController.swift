import UIKit
import SafariServices

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        
        let titleLabel = UILabel()
        titleLabel.text = "ChronicleSync"
        titleLabel.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        
        let descriptionLabel = UILabel()
        descriptionLabel.text = "Safari Extension for syncing across browsers"
        descriptionLabel.font = UIFont.systemFont(ofSize: 16)
        descriptionLabel.translatesAutoresizingMaskIntoConstraints = false
        
        let enableButton = UIButton(type: .system)
        enableButton.setTitle("Enable Extension in Safari", for: .normal)
        enableButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
        enableButton.backgroundColor = .systemBlue
        enableButton.setTitleColor(.white, for: .normal)
        enableButton.layer.cornerRadius = 10
        enableButton.addTarget(self, action: #selector(openSafariSettings), for: .touchUpInside)
        enableButton.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(titleLabel)
        view.addSubview(descriptionLabel)
        view.addSubview(enableButton)
        
        NSLayoutConstraint.activate([
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 60),
            
            descriptionLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            descriptionLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 20),
            
            enableButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            enableButton.topAnchor.constraint(equalTo: descriptionLabel.bottomAnchor, constant: 40),
            enableButton.widthAnchor.constraint(equalToConstant: 250),
            enableButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }
    
    @objc func openSafariSettings() {
        // In simulator, this will just show an alert since we can't open Settings directly
        let alert = UIAlertController(
            title: "Enable Extension", 
            message: "To enable the extension, go to Settings > Safari > Extensions", 
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
