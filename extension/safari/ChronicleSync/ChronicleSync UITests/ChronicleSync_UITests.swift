import XCTest

class ChronicleSync_UITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
        
        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false
        
        // Initialize the app
        app = XCUIApplication()
        
        // Add any setup code here
        // For example, to launch the app in a specific locale or with specific arguments
        // app.launchArguments = ["-UITest"]
        // app.launchEnvironment = ["ENV_VAR": "value"]
    }
    
    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        app = nil
    }
    
    func testAppLaunch() throws {
        // Test that the app launches successfully
        app.launch()
        
        // Verify that the main UI elements are present
        XCTAssertTrue(app.staticTexts["ChronicleSync"].exists, "App title should be visible")
        
        // Check for the extension status label
        let statusLabel = app.staticTexts.matching(identifier: "statusLabel").firstMatch
        XCTAssertTrue(statusLabel.exists, "Status label should be visible")
        
        // Check for the enable extension button
        let enableButton = app.buttons.matching(NSPredicate(format: "label CONTAINS 'Extension'")).firstMatch
        XCTAssertTrue(enableButton.exists, "Enable extension button should be visible")
        
        // Check for the open Safari button
        let safariButton = app.buttons["Open Safari"]
        XCTAssertTrue(safariButton.exists, "Open Safari button should be visible")
    }
    
    func testEnableExtensionButton() throws {
        // Test that tapping the enable extension button works
        app.launch()
        
        // Get the enable extension button
        let enableButton = app.buttons.matching(NSPredicate(format: "label CONTAINS 'Extension'")).firstMatch
        XCTAssertTrue(enableButton.exists, "Enable extension button should be visible")
        
        // Tap the button - this should open Safari settings
        // Note: We can't verify the Safari settings screen in UI tests due to app boundaries,
        // but we can verify the button is tappable
        enableButton.tap()
        
        // Wait a moment to see if the app crashes
        sleep(1)
        
        // Verify the app is still running
        XCTAssertTrue(app.exists, "App should still be running after tapping enable button")
    }
    
    func testOpenSafariButton() throws {
        // Test that tapping the open Safari button works
        app.launch()
        
        // Get the open Safari button
        let safariButton = app.buttons["Open Safari"]
        XCTAssertTrue(safariButton.exists, "Open Safari button should be visible")
        
        // Tap the button - this should open Safari
        // Note: We can't verify Safari opens in UI tests due to app boundaries,
        // but we can verify the button is tappable
        safariButton.tap()
        
        // Wait a moment to see if the app crashes
        sleep(1)
        
        // Verify the app is still running
        XCTAssertTrue(app.exists, "App should still be running after tapping Safari button")
    }
}