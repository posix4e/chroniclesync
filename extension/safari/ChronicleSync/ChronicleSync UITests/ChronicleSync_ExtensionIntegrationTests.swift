import XCTest

class ChronicleSync_ExtensionIntegrationTests: XCTestCase {
    
    var app: XCUIApplication!
    var safari: XCUIApplication!
    
    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
        
        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false
        
        // Initialize the app with test mode flag
        app = XCUIApplication()
        app.launchArguments = ["-UITestMode"]
        
        // Initialize Safari
        safari = XCUIApplication(bundleIdentifier: "com.apple.Safari")
    }
    
    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        app = nil
        safari = nil
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
    
    func testExtensionTestModeScreen() throws {
        // Launch the app in test mode
        app.launch()
        
        // Wait for the test mode screen to appear
        let testModeLabel = app.staticTexts["testModeLabel"]
        XCTAssertTrue(testModeLabel.waitForExistence(timeout: 5), "Test mode label should appear")
        
        // Take a screenshot of the main screen with test mode indicator
        takeScreenshot(name: "TestMode_MainScreen")
        
        // Wait for the test settings screen to appear
        let testSettingsTitle = app.staticTexts["testSettingsTitle"]
        XCTAssertTrue(testSettingsTitle.waitForExistence(timeout: 5), "Test settings title should appear")
        
        // Take a screenshot of the test settings screen
        takeScreenshot(name: "TestMode_SettingsScreen")
        
        // Verify the test settings screen elements
        XCTAssertTrue(app.staticTexts["testSettingsStatus"].exists, "Test settings status should be visible")
        XCTAssertTrue(app.buttons["simulateActivationButton"].exists, "Simulate activation button should be visible")
        
        // Tap the simulate activation button
        app.buttons["simulateActivationButton"].tap()
        
        // Wait for the alert to appear
        let alert = app.alerts["Extension Activated"]
        XCTAssertTrue(alert.waitForExistence(timeout: 5), "Activation alert should appear")
        
        // Take a screenshot of the activation alert
        takeScreenshot(name: "TestMode_ActivationAlert")
        
        // Dismiss the alert
        alert.buttons["OK"].tap()
    }
    
    func testSafariExtensionLaunch() throws {
        // First launch our app to ensure the extension is ready
        app.launch()
        
        // Wait briefly for the app to initialize
        sleep(2)
        
        // Take a screenshot of the app
        takeScreenshot(name: "App_BeforeSafariLaunch")
        
        // Terminate our app
        app.terminate()
        
        // Launch Safari
        safari.launch()
        
        // Wait for Safari to fully launch
        sleep(3)
        
        // Take a screenshot of Safari
        takeScreenshot(name: "Safari_AfterLaunch")
        
        // Navigate to the ChronicleSync website
        let urlTextField = safari.textFields["URL"]
        XCTAssertTrue(urlTextField.waitForExistence(timeout: 5), "URL text field should be visible")
        
        urlTextField.tap()
        urlTextField.typeText("https://www.chroniclesync.xyz\n")
        
        // Wait for the page to load
        sleep(5)
        
        // Take a screenshot of the website
        takeScreenshot(name: "Safari_ChronicleWebsite")
        
        // Try to activate the extension (this is a simulation since we can't actually control Safari's extension UI)
        // In a real test, we would need to use accessibility features or other methods to interact with Safari's extension UI
        
        // For simulation purposes, we'll just take another screenshot
        takeScreenshot(name: "Safari_SimulatedExtensionActivation")
        
        // Return to our app to show the extension is "activated"
        safari.terminate()
        app.launch()
        
        // Wait for the test settings screen to appear
        let testSettingsTitle = app.staticTexts["testSettingsTitle"]
        XCTAssertTrue(testSettingsTitle.waitForExistence(timeout: 5), "Test settings title should appear")
        
        // Simulate extension activation
        app.buttons["simulateActivationButton"].tap()
        
        // Wait for the alert to appear
        let alert = app.alerts["Extension Activated"]
        XCTAssertTrue(alert.waitForExistence(timeout: 5), "Activation alert should appear")
        
        // Take a final screenshot showing the "activated" extension
        takeScreenshot(name: "App_ExtensionActivated")
    }
}