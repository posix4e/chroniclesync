import UIKit
import SafariServices

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let button = UIButton(type: .system)
        button.setTitle("Open Safari Extension Settings", for: .normal)
        button.addTarget(self, action: #selector(openSettings), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(button)
        NSLayoutConstraint.activate([
            button.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            button.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
    
    @objc func openSettings() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "com.chroniclesync.extension") { error in
            if let error = error {
                print("Error opening Safari extension settings: \(error)")
            }
        }
    }
}