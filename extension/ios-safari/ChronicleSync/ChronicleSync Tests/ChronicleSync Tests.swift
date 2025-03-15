import XCTest
import SafariServices
@testable import ChronicleSync

class ChronicleSyncTests: XCTestCase {
    
    var app: XCUIApplication!
    var safari: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        
        // Initialize the main app
        app = XCUIApplication()
        app.launch()
        
        // Initialize Safari
        safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
    }
    
    override func tearDownWithError() throws {
        // Clean up after each test
        app.terminate()
        safari.terminate()
    }
    
    func testExtensionEnabling() throws {
        // Take a screenshot of the initial app state
        let initialScreenshot = XCUIScreen.main.screenshot()
        saveScreenshot(initialScreenshot, named: "01_initial_app_state")
        
        // Tap the "Enable Extension" button
        let enableButton = app.buttons["Enable Extension"]
        XCTAssertTrue(enableButton.exists, "Enable Extension button should exist")
        enableButton.tap()
        
        // Wait for Safari settings to appear
        // Note: In a real test, we would need to handle the system dialog that appears
        // This is a simplified version for demonstration
        
        // Take a screenshot after tapping the button
        let afterTapScreenshot = XCUIScreen.main.screenshot()
        saveScreenshot(afterTapScreenshot, named: "02_after_enable_button_tap")
    }
    
    func testSafariExtensionFunctionality() throws {
        // Launch Safari
        safari.launch()
        
        // Navigate to a test website
        safari.textFields["URL"].tap()
        safari.textFields["URL"].typeText("https://example.com\n")
        
        // Wait for the page to load
        let pageLoaded = safari.staticTexts["Example Domain"].waitForExistence(timeout: 10)
        XCTAssertTrue(pageLoaded, "Example.com should load")
        
        // Take a screenshot of the loaded page
        let pageLoadedScreenshot = XCUIScreen.main.screenshot()
        saveScreenshot(pageLoadedScreenshot, named: "03_example_page_loaded")
        
        // Tap on Safari's share button to access extensions
        // Note: In a real test, we would need to handle the system UI for accessing extensions
        // This is a simplified version for demonstration
        
        // Take a screenshot of the extension in action
        let extensionScreenshot = XCUIScreen.main.screenshot()
        saveScreenshot(extensionScreenshot, named: "04_extension_in_action")
    }
    
    // Helper function to save screenshots
    private func saveScreenshot(_ screenshot: XCUIScreenshot, named name: String) {
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        
        // In a CI environment, we would also save these to a specific directory
        // that gets uploaded as artifacts
    }
}