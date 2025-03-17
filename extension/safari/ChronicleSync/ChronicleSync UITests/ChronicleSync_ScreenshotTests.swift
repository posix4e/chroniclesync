import XCTest

class ChronicleSync_ScreenshotTests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
        
        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false
        
        // Initialize the app
        app = XCUIApplication()
    }
    
    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        app = nil
    }
    
    // Helper function to take a screenshot and save it with a given name
    func takeScreenshot(name: String) {
        // Create a unique filename with timestamp
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyyMMdd_HHmmss"
        let timestamp = formatter.string(from: Date())
        
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "\(name)_\(timestamp)"
        attachment.lifetime = .keepAlways
        add(attachment)
        
        // Log that we took a screenshot
        print("📸 Took screenshot: \(attachment.name!)")
    }
    
    func testMainScreenScreenshot() throws {
        // Launch the app
        app.launch()
        
        // Wait for the UI to stabilize
        sleep(1)
        
        // Take a screenshot of the main screen
        takeScreenshot(name: "MainScreen")
        
        // Verify key elements are present
        XCTAssertTrue(app.staticTexts["ChronicleSync"].exists, "App title should be visible")
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label CONTAINS 'Extension'")).firstMatch.exists, "Enable extension button should be visible")
    }
    
    func testAllScreensScreenshots() throws {
        // Launch the app
        app.launch()
        
        // Wait for the UI to stabilize
        sleep(1)
        
        // Take a screenshot of the initial state
        takeScreenshot(name: "InitialState")
        
        // Tap the enable extension button
        let enableButton = app.buttons.matching(NSPredicate(format: "label CONTAINS 'Extension'")).firstMatch
        if enableButton.exists {
            enableButton.tap()
            
            // Wait for any UI changes
            sleep(1)
            
            // Take a screenshot after tapping the enable button
            takeScreenshot(name: "AfterEnableButtonTap")
            
            // Go back to the app (if possible)
            app.activate()
            sleep(1)
        }
        
        // Take a final screenshot
        takeScreenshot(name: "FinalState")
    }
    
    func testTestModeScreenshots() throws {
        // Launch the app in test mode
        app.launchArguments = ["-UITestMode"]
        app.launch()
        
        // Wait for the UI to stabilize
        sleep(1)
        
        // Take a screenshot of the main screen in test mode
        takeScreenshot(name: "TestMode_MainScreen")
        
        // Verify test mode elements are present
        XCTAssertTrue(app.staticTexts["testModeLabel"].exists, "Test mode label should be visible")
        
        // Wait for the test settings screen to appear
        let testSettingsTitle = app.staticTexts["testSettingsTitle"]
        XCTAssertTrue(testSettingsTitle.waitForExistence(timeout: 5), "Test settings title should appear")
        
        // Take a screenshot of the test settings screen
        takeScreenshot(name: "TestMode_SettingsScreen")
        
        // Tap the simulate activation button
        app.buttons["simulateActivationButton"].tap()
        
        // Wait for the alert to appear
        let alert = app.alerts["Extension Activated"]
        XCTAssertTrue(alert.waitForExistence(timeout: 5), "Activation alert should appear")
        
        // Take a screenshot of the activation alert
        takeScreenshot(name: "TestMode_ActivationAlert")
    }
}