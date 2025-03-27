import XCTest
import SafariServices
@testable import ChronicleSync

final class ChronicleSync_Tests: XCTestCase {
    
    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
        continueAfterFailure = false
    }
    
    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }
    
    func testAppLaunch() throws {
        // UI tests must launch the application that they test.
        let app = XCUIApplication()
        app.launch()
        
        // Verify the app launched successfully
        XCTAssertTrue(app.isRunning)
        
        // Take a screenshot of the main screen
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        attachment.name = "App Launch Screen"
        add(attachment)
        
        // Verify main UI elements are present
        XCTAssertTrue(app.staticTexts["ChronicleSync"].exists)
        XCTAssertTrue(app.buttons["Enable Safari Extension"].exists)
        XCTAssertTrue(app.buttons["Open Settings"].exists)
    }
    
    func testSettingsButton() throws {
        let app = XCUIApplication()
        app.launch()
        
        // Tap the Settings button
        app.buttons["Open Settings"].tap()
        
        // Take a screenshot after tapping settings
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        attachment.name = "Settings Screen"
        add(attachment)
        
        // Since this would open Safari, we can't easily verify the result in this test
        // In a real test, we would need to handle the app switching
    }
    
    func testExtensionEnableButton() throws {
        let app = XCUIApplication()
        app.launch()
        
        // Tap the Enable Extension button
        app.buttons["Enable Safari Extension"].tap()
        
        // Take a screenshot after tapping enable extension
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        attachment.name = "Extension Enable Screen"
        add(attachment)
        
        // Since this would open Settings, we can't easily verify the result in this test
        // In a real test, we would need to handle the app switching
    }
}