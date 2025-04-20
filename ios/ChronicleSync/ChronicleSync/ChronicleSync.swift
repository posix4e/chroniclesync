import SwiftUI

@main
struct ChronicleSync: App {
    @State private var isUITesting = false
    @State private var useProductionAPI = false
    
    init() {
        // Check for UI testing flags
        let arguments = ProcessInfo.processInfo.arguments
        isUITesting = arguments.contains("--uitesting")
        useProductionAPI = arguments.contains("--use-production-api")
        
        // Configure API endpoint based on testing mode
        if isUITesting {
            configureForTesting()
        }
    }
    
    private func configureForTesting() {
        // Set up the app for automated testing
        if useProductionAPI {
            // Use production API endpoint
            UserDefaults.standard.set("https://api.chroniclesync.xyz", forKey: "api_endpoint")
        } else {
            // Use staging API endpoint
            UserDefaults.standard.set("https://api-staging.chroniclesync.xyz", forKey: "api_endpoint")
        }
        
        // Set a test API key if needed
        UserDefaults.standard.set("test-api-key-for-automated-testing", forKey: "api_key")
        
        // Enable debug logging
        UserDefaults.standard.set(true, forKey: "debug_logging")
        
        // Other test-specific configurations
        UserDefaults.standard.set(true, forKey: "auto_sync_enabled")
        UserDefaults.standard.set(30, forKey: "sync_interval_seconds") // Use shorter interval for testing
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    if isUITesting {
                        // Perform any additional setup needed for UI testing
                        print("Running in UI Testing mode")
                    }
                }
        }
    }
}