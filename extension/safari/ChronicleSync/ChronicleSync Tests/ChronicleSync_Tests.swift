import XCTest

class ChronicleSync_Tests: XCTestCase {
    
    let app = XCUIApplication()
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
    }
    
    func testBasicFunctionality() throws {
        // Take a screenshot of the initial state
        let screenshot1 = XCUIScreen.main.screenshot()
        let attachment1 = XCTAttachment(screenshot: screenshot1)
        attachment1.name = "Initial State"
        attachment1.lifetime = .keepAlways
        add(attachment1)
        
        // Test basic app functionality
        XCTAssertTrue(app.buttons["Settings"].exists, "Settings button should exist")
        
        // Navigate to settings
        app.buttons["Settings"].tap()
        
        // Take a screenshot of the settings screen
        let screenshot2 = XCUIScreen.main.screenshot()
        let attachment2 = XCTAttachment(screenshot: screenshot2)
        attachment2.name = "Settings Screen"
        attachment2.lifetime = .keepAlways
        add(attachment2)
        
        // Verify settings screen elements
        XCTAssertTrue(app.staticTexts["ChronicleSync Settings"].exists, "Settings title should exist")
    }
    
    func testSafariExtension() throws {
        // Launch Safari
        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        safari.launch()
        
        // Take a screenshot of Safari
        let screenshot1 = XCUIScreen.main.screenshot()
        let attachment1 = XCTAttachment(screenshot: screenshot1)
        attachment1.name = "Safari Initial State"
        attachment1.lifetime = .keepAlways
        add(attachment1)
        
        // Navigate to a test website
        safari.textFields["URL"].tap()
        safari.textFields["URL"].typeText("example.com\n")
        
        // Wait for page to load
        sleep(2)
        
        // Take a screenshot of the loaded page
        let screenshot2 = XCUIScreen.main.screenshot()
        let attachment2 = XCTAttachment(screenshot: screenshot2)
        attachment2.name = "Example.com Loaded"
        attachment2.lifetime = .keepAlways
        add(attachment2)
        
        // Activate the extension (this will depend on your extension's UI)
        // For example, tap the extension button in the toolbar
        safari.buttons["Share"].tap()
        
        // Wait for share sheet
        sleep(1)
        
        // Take a screenshot of the share sheet
        let screenshot3 = XCUIScreen.main.screenshot()
        let attachment3 = XCTAttachment(screenshot: screenshot3)
        attachment3.name = "Share Sheet"
        attachment3.lifetime = .keepAlways
        add(attachment3)
        
        // Look for our extension in the share sheet
        // Note: This might need adjustment based on your actual UI
        if safari.buttons["ChronicleSync"].exists {
            safari.buttons["ChronicleSync"].tap()
            
            // Wait for extension UI
            sleep(1)
            
            // Take a screenshot of the extension UI
            let screenshot4 = XCUIScreen.main.screenshot()
            let attachment4 = XCTAttachment(screenshot: screenshot4)
            attachment4.name = "Extension UI"
            attachment4.lifetime = .keepAlways
            add(attachment4)
        } else {
            XCTFail("ChronicleSync extension button not found in share sheet")
        }
    }
}