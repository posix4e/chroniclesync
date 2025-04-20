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
        // Test that the app launches correctly
        XCTAssertTrue(app.staticTexts["ChronicleSync"].exists)
        
        // Take a screenshot of the main app screen
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "AppLaunch"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    
    func testEnableExtensionButton() throws {
        // Test that the Enable Safari Extension button exists
        let enableButton = app.buttons["Enable Safari Extension"]
        XCTAssertTrue(enableButton.exists)
        
        // Take a screenshot of the button
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "EnableExtensionButton"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    
    func testLearnMoreButton() throws {
        // Test that the Learn More button exists
        let learnMoreButton = app.buttons["Learn More"]
        XCTAssertTrue(learnMoreButton.exists)
        
        // Take a screenshot of the button
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "LearnMoreButton"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}