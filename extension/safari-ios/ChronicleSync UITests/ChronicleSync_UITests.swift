import XCTest

class ChronicleSync_UITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        
        // Add ability to take screenshots
        let attachments = self.attachments
        let testName = self.name
        addUIInterruptionMonitor(withDescription: "System Dialog") { (alert) -> Bool in
            let screenshot = XCUIScreen.main.screenshot()
            let attachment = XCTAttachment(screenshot: screenshot)
            attachment.lifetime = .keepAlways
            attachment.name = "\(testName)_system_dialog"
            attachments.append(attachment)
            return false
        }
        
        // Launch the app
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app.terminate()
    }
    
    func takeScreenshot(name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        attachment.name = name
        add(attachment)
    }
    
    func testAppLaunch() throws {
        // Verify the app launches successfully
        XCTAssertTrue(app.staticTexts["ChronicleSync"].exists)
        takeScreenshot(name: "app_launch")
        
        // Verify the "Open Safari Settings" button exists
        XCTAssertTrue(app.buttons["Open Safari Settings"].exists)
        takeScreenshot(name: "main_screen")
    }
    
    func testOpenSafariSettings() throws {
        // Tap the "Open Safari Settings" button
        let openSettingsButton = app.buttons["Open Safari Settings"]
        XCTAssertTrue(openSettingsButton.exists)
        
        takeScreenshot(name: "before_tap_settings")
        
        // Note: This will actually open the Settings app, which we can't control in UI tests
        // So we'll just verify the button is tappable
        XCTAssertTrue(openSettingsButton.isHittable)
        
        // Simulate tapping the button (this will leave the test app)
        openSettingsButton.tap()
        
        // Take a screenshot after tapping (may show Settings app)
        takeScreenshot(name: "after_tap_settings")
    }
    
    func testExtensionEnabling() throws {
        // This is a simulated test since we can't actually control Safari from UI tests
        
        // Take screenshot of main app
        takeScreenshot(name: "extension_main_app")
        
        // Simulate the steps a user would take to enable the extension
        // 1. Open Safari Settings (already tested in testOpenSafariSettings)
        // 2. Navigate to Extensions
        // 3. Enable ChronicleSync extension
        
        // Since we can't actually perform these steps in UI tests, we'll just document them with screenshots
        takeScreenshot(name: "extension_enabling_simulation")
        
        // Add a simulated screenshot of what the extension would look like when enabled
        takeScreenshot(name: "extension_enabled_simulation")
    }
    
    func testAllMainWorkflows() throws {
        // This test combines all main workflows into one test for efficiency
        
        // 1. App Launch
        XCTAssertTrue(app.staticTexts["ChronicleSync"].exists)
        takeScreenshot(name: "workflow_app_launch")
        
        // 2. Settings Button
        let openSettingsButton = app.buttons["Open Safari Settings"]
        XCTAssertTrue(openSettingsButton.exists)
        takeScreenshot(name: "workflow_settings_button")
        
        // 3. Simulated Extension Enabling
        takeScreenshot(name: "workflow_extension_enabling")
        
        // 4. Simulated Extension Usage
        takeScreenshot(name: "workflow_extension_usage")
        
        // 5. Simulated Data Synchronization
        takeScreenshot(name: "workflow_data_sync")
    }
}