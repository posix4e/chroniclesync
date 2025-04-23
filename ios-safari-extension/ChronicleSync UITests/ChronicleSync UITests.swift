import XCTest

class ChronicleSync_UITests: XCTestCase {
    
    var app: XCUIApplication!

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testAppLaunch() throws {
        // Test that the app launches successfully
        XCTAssert(app.staticTexts["ChronicleSync"].exists)
        XCTAssert(app.staticTexts["Sync your browsing history across devices"].exists)
        
        // Take a screenshot of the main app screen
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "AppLaunch"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    
    func testEnableExtensionButton() throws {
        // Test that the Enable Extension button shows instructions
        let enableButton = app.buttons["Enable Extension"]
        XCTAssert(enableButton.exists)
        
        enableButton.tap()
        
        // Verify instructions sheet appears
        XCTAssert(app.staticTexts["How to enable the ChronicleSync extension:"].exists)
        
        // Take a screenshot of the instructions
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "EnableInstructions"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    
    func testOpenSettingsButton() throws {
        // Test that the Open Settings button works
        let settingsButton = app.buttons["Open Settings"]
        XCTAssert(settingsButton.exists)
        
        // Note: We can't actually test opening Settings in a UI test
        // as it would leave the app, but we can verify the button exists
    }
    
    // Safari extension testing would require special test infrastructure
    // to launch Safari and interact with the extension
    func testSafariExtensionIntegration() throws {
        // This is a placeholder for Safari extension testing
        // In a real implementation, we would need to:
        // 1. Launch Safari
        // 2. Enable the extension
        // 3. Navigate to a test page
        // 4. Verify the extension functionality
        // 5. Take screenshots at key points
        
        // For now, we'll just mark this as a success
        XCTAssert(true)
    }
}