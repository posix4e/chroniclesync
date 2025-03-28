import XCTest
import SafariServices

final class ChronicleSync_UITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app.terminate()
    }
    
    func testAppLaunch() throws {
        // Verify the app launches correctly
        let statusLabel = app.staticTexts["ChronicleSync Safari Extension"]
        XCTAssertTrue(statusLabel.exists, "Status label should exist")
        
        // Take a screenshot of the main screen
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        attachment.name = "MainScreen"
        add(attachment)
    }
    
    func testOpenSafari() throws {
        // Tap the Open Safari button
        let openSafariButton = app.buttons["Open Safari"]
        XCTAssertTrue(openSafariButton.exists, "Open Safari button should exist")
        openSafariButton.tap()
        
        // Wait for Safari to open
        let safariViewController = app.otherElements["SFSafariView"]
        XCTAssertTrue(safariViewController.waitForExistence(timeout: 5), "Safari view should appear")
        
        // Take a screenshot of Safari
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        attachment.name = "SafariScreen"
        add(attachment)
        
        // Dismiss Safari
        let doneButton = safariViewController.buttons["Done"]
        if doneButton.exists {
            doneButton.tap()
        }
    }
    
    func testOpenExtensionSettings() throws {
        // Tap the Extension Settings button
        let settingsButton = app.buttons["Extension Settings"]
        XCTAssertTrue(settingsButton.exists, "Extension Settings button should exist")
        settingsButton.tap()
        
        // Wait for Settings to open
        // Note: We can't fully test this in the simulator as it would open the actual Settings app
        
        // Take a screenshot
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        attachment.name = "SettingsRedirect"
        add(attachment)
    }
}