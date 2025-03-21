import XCTest

// Extension to XCUIElement to add useful testing helpers
extension XCUIElement {
    
    /// Waits for the element to exist and be hittable, then taps it
    /// - Parameter timeout: The timeout in seconds
    /// - Returns: true if the tap was successful, false otherwise
    @discardableResult
    func waitForHittableThenTap(timeout: TimeInterval = 5) -> Bool {
        guard self.waitForExistence(timeout: timeout) else {
            return false
        }
        
        let startTime = Date()
        while !self.isHittable {
            if Date().timeIntervalSince(startTime) > timeout {
                return false
            }
            Thread.sleep(forTimeInterval: 0.1)
        }
        
        self.tap()
        return true
    }
    
    /// Types text into the element after clearing its current content
    /// - Parameter text: The text to type
    func clearAndTypeText(_ text: String) {
        // Tap to activate the field
        self.tap()
        
        // Clear existing text
        if let currentValue = self.value as? String, !currentValue.isEmpty {
            let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: currentValue.count)
            self.typeText(deleteString)
        }
        
        // Type the new text
        self.typeText(text)
    }
}

// Helper class for test environment configuration
class TestEnvironment {
    
    static let shared = TestEnvironment()
    
    // Get environment variables or use defaults
    var apiBaseURL: String {
        return ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://api-staging.chroniclesync.xyz"
    }
    
    var webBaseURL: String {
        return ProcessInfo.processInfo.environment["WEB_BASE_URL"] ?? "https://staging.chroniclesync.xyz"
    }
    
    var isDebugMode: Bool {
        return ProcessInfo.processInfo.environment["DEBUG_MODE"] == "true"
    }
    
    // Test account credentials (for testing purposes only)
    var testUsername: String {
        return ProcessInfo.processInfo.environment["TEST_USERNAME"] ?? "test@example.com"
    }
    
    var testPassword: String {
        return ProcessInfo.processInfo.environment["TEST_PASSWORD"] ?? "TestPassword123"
    }
    
    // Helper to log test information when in debug mode
    func log(_ message: String) {
        if isDebugMode {
            print("📱 TEST: \(message)")
        }
    }
    
    // Helper to take and save a screenshot with a descriptive name
    func takeScreenshot(from testCase: XCTestCase, name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        testCase.add(attachment)
        
        log("Screenshot taken: \(name)")
    }
}