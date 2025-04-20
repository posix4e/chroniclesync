import SwiftUI
import SafariServices

struct ContentView: View {
    @State private var isExtensionEnabled = false
    @State private var isUITesting = ProcessInfo.processInfo.arguments.contains("--uitesting")
    @State private var verificationResult: String = ""
    @State private var isVerifying = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "globe")
                    .imageScale(.large)
                    .foregroundColor(.accentColor)
                    .font(.system(size: 60))
                    .padding(.bottom, 20)
                
                Text("ChronicleSync")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Sync your browsing history across devices")
                    .font(.subheadline)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Spacer().frame(height: 40)
                
                VStack(alignment: .leading, spacing: 15) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Secure end-to-end encryption")
                    }
                    
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Sync across all your devices")
                    }
                    
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Private and secure")
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
                
                Spacer()
                
                Button(action: {
                    openSafariExtensionSettings()
                }) {
                    Text("Enable Safari Extension")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding(.horizontal)
                
                Button(action: {
                    if let url = URL(string: "https://chroniclesync.xyz") {
                        UIApplication.shared.open(url)
                    }
                }) {
                    Text("Learn More")
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray5))
                        .foregroundColor(.primary)
                        .cornerRadius(10)
                }
                .padding(.horizontal)
                
                // Special UI elements for testing
                if isUITesting {
                    Divider()
                        .padding(.vertical)
                    
                    Button("Verify Sync") {
                        verifySync()
                    }
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                    .accessibilityIdentifier("verify-sync-button")
                    
                    if isVerifying {
                        ProgressView()
                            .padding()
                    }
                    
                    Text(verificationResult)
                        .padding()
                        .accessibilityIdentifier("verification-result")
                }
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private func openSafariExtensionSettings() {
        if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(settingsURL)
        }
    }
    
    private func verifySync() {
        isVerifying = true
        verificationResult = ""
        
        // Get API endpoint and key from UserDefaults
        let apiEndpoint = UserDefaults.standard.string(forKey: "api_endpoint") ?? "https://api.chroniclesync.xyz"
        let apiKey = UserDefaults.standard.string(forKey: "api_key") ?? ""
        
        // Create verification request
        guard let url = URL(string: "\(apiEndpoint)/verify-sync") else {
            verificationResult = "Invalid API endpoint"
            isVerifying = false
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        // Perform request
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                isVerifying = false
                
                if let error = error {
                    verificationResult = "Error: \(error.localizedDescription)"
                    return
                }
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    verificationResult = "Invalid response"
                    return
                }
                
                if httpResponse.statusCode == 200 {
                    verificationResult = "Sync Verified"
                } else {
                    verificationResult = "Verification failed: HTTP \(httpResponse.statusCode)"
                }
            }
        }.resume()
    }
}

#Preview {
    ContentView()
}