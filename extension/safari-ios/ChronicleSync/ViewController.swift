import UIKit
import SafariServices
import WebKit

class ViewController: UIViewController {
    
    private let webView = WKWebView()
    private let enableExtensionButton = UIButton(type: .system)
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = .systemBackground
        
        setupWebView()
        setupEnableExtensionButton()
        
        loadWelcomePage()
    }
    
    private func setupWebView() {
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.heightAnchor.constraint(equalTo: view.heightAnchor, multiplier: 0.6)
        ])
    }
    
    private func setupEnableExtensionButton() {
        enableExtensionButton.translatesAutoresizingMaskIntoConstraints = false
        enableExtensionButton.setTitle("Enable ChronicleSync Extension", for: .normal)
        enableExtensionButton.titleLabel?.font = UIFont.systemFont(ofSize: 18)
        enableExtensionButton.addTarget(self, action: #selector(openSafariExtensionSettings), for: .touchUpInside)
        
        view.addSubview(enableExtensionButton)
        
        NSLayoutConstraint.activate([
            enableExtensionButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            enableExtensionButton.topAnchor.constraint(equalTo: webView.bottomAnchor, constant: 40)
        ])
    }
    
    private func loadWelcomePage() {
        let htmlString = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    padding: 20px;
                    line-height: 1.5;
                    color: #333;
                }
                h1 {
                    color: #2c3e50;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                }
                .steps {
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 20px;
                }
                .step {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to ChronicleSync</h1>
                <p>ChronicleSync helps you track and sync your browsing history across devices.</p>
                
                <div class="steps">
                    <h2>How to enable the extension:</h2>
                    <div class="step">1. Tap the "Enable ChronicleSync Extension" button below</div>
                    <div class="step">2. In Safari Settings, enable ChronicleSync</div>
                    <div class="step">3. Return to this app</div>
                </div>
                
                <p>Once enabled, the extension will work in Safari to track your browsing history.</p>
            </div>
        </body>
        </html>
        """
        
        webView.loadHTMLString(htmlString, baseURL: nil)
    }
    
    @objc private func openSafariExtensionSettings() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "xyz.chroniclesync.ChronicleSync.Extension") { error in
            guard error == nil else {
                // Handle error
                print("Error opening Safari extension preferences: \(error!)")
                return
            }
        }
    }
}