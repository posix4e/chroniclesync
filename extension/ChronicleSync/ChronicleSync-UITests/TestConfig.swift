import Foundation

struct TestConfig {
    static let apiUrl = ProcessInfo.processInfo.environment["API_URL"] ?? "http://localhost:3000"
    static let testTimeout: TimeInterval = 30
    static let shortWaitTime: TimeInterval = 1
    static let mediumWaitTime: TimeInterval = 3
    static let longWaitTime: TimeInterval = 5
    
    // Test URLs
    static let exampleUrl = "https://example.com"
    static let testPageUrl = "\(apiUrl)/test-page"
    
    // API endpoints
    static let healthEndpoint = "\(apiUrl)/health"
}