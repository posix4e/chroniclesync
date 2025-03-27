import XCTest
import SafariServices
@testable import ChronicleSync

class ChronicleSync_Tests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }
    
    func testAppLaunch() throws {
        // Verify the app launches successfully
        XCTAssertTrue(app.buttons["Enable Safari Extension"].exists)
        
        // Take a screenshot of the main app screen
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        attachment.name = "AppLaunch"
        add(attachment)
    }
    
    func testExtensionEnabling() throws {
        // Tap the "Enable Safari Extension" button
        app.buttons["Enable Safari Extension"].tap()
        
        // Wait for the Safari preferences to appear
        // Note: In a real test environment, we would need to handle system dialogs
        // This is a simplified version for demonstration
        
        // Take a screenshot after tapping the button
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        attachment.name = "ExtensionPreferences"
        add(attachment)
    }
}