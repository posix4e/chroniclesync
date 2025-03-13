import XCTest

class SafariExtensionUITest: XCTestCase {
    
    override func setUpWithError() throws {
        continueAfterFailure = false
    }
    
    func testSafariExtension() throws {
        let app = XCUIApplication()
        app.launch()
        
        // Wait for the app to be ready
        XCTAssert(app.buttons["Open Safari and Enable Extension"].waitForExistence(timeout: 5))
        
        // Tap the button to open Safari
        app.buttons["Open Safari and Enable Extension"].tap()
        
        // Wait for Safari to open
        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        XCTAssert(safari.wait(for: .runningForeground, timeout: 10))
        
        // Navigate to a test page
        safari.textFields["Address"].tap()
        safari.textFields["Address"].typeText("https://example.com\n")
        
        // Wait for the page to load
        XCTAssert(safari.staticTexts["Example Domain"].waitForExistence(timeout: 10))
        
        // Open extension menu (this may vary depending on your extension's UI)
        safari.buttons["Share"].tap()
        
        // Look for your extension in the share sheet
        XCTAssert(safari.buttons["ChronicleSync"].waitForExistence(timeout: 5))
        
        // Tap on your extension
        safari.buttons["ChronicleSync"].tap()
        
        // Add assertions specific to your extension's functionality
        // For example, check if a specific UI element appears
        
        // Close Safari
        XCUIDevice.shared.press(.home)
    }
}