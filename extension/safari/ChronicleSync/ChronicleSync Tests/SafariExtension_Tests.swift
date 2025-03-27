import XCTest
import SafariServices
@testable import ChronicleSync

class SafariExtension_Tests: XCTestCase {
    
    var safariApp: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        
        // Launch Safari
        safariApp = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        safariApp.launch()
    }
    
    override func tearDownWithError() throws {
        safariApp.terminate()
        safariApp = nil
    }
    
    func testExtensionFunctionality() throws {
        // Navigate to a test website
        let urlBar = safariApp.textFields["URL"]
        urlBar.tap()
        urlBar.typeText("https://www.example.com\n")
        
        // Wait for the page to load
        let webView = safariApp.webViews.element
        XCTAssertTrue(webView.waitForExistence(timeout: 10))
        
        // Take a screenshot of the loaded page
        let screenshot1 = XCUIScreen.main.screenshot()
        let attachment1 = XCTAttachment(screenshot: screenshot1)
        attachment1.lifetime = .keepAlways
        attachment1.name = "WebPage"
        add(attachment1)
        
        // Tap the share button to access extensions
        safariApp.buttons["Share"].tap()
        
        // Wait for the share sheet
        let shareSheet = safariApp.otherElements["ActivityListView"]
        XCTAssertTrue(shareSheet.waitForExistence(timeout: 5))
        
        // Take a screenshot of the share sheet
        let screenshot2 = XCUIScreen.main.screenshot()
        let attachment2 = XCTAttachment(screenshot: screenshot2)
        attachment2.lifetime = .keepAlways
        attachment2.name = "ShareSheet"
        add(attachment2)
        
        // Note: In a real test environment, we would need to:
        // 1. Ensure our extension is enabled
        // 2. Tap on our extension in the share sheet
        // 3. Verify the extension UI appears
        // 4. Interact with the extension
        
        // This is a simplified version for demonstration
    }
    
    func testPopupFunctionality() throws {
        // Navigate to a test website
        let urlBar = safariApp.textFields["URL"]
        urlBar.tap()
        urlBar.typeText("https://www.example.com\n")
        
        // Wait for the page to load
        let webView = safariApp.webViews.element
        XCTAssertTrue(webView.waitForExistence(timeout: 10))
        
        // Access Safari extensions (this is a simplified version)
        // In a real test, we would need to:
        // 1. Tap the extensions button
        // 2. Select our extension
        // 3. Verify the popup appears
        
        // For demonstration, we'll just take screenshots
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        attachment.name = "ExtensionPopup"
        add(attachment)
    }
}