import XCTest

class ChronicleSync_SafariUITests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false

        // In UI tests it's important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testAppLaunch() throws {
        // UI tests must launch the application that they test.
        let app = XCUIApplication()
        app.launch()
        
        // Verify that the app launched successfully
        XCTAssertTrue(app.buttons["Enable Extension"].exists || app.buttons["Extension Settings"].exists, "Extension button should exist")
        
        // Verify that the status label exists
        XCTAssertTrue(app.staticTexts.element(matching: .any, identifier: "statusLabel").exists, "Status label should exist")
    }
    
    func testExtensionButtonTap() throws {
        let app = XCUIApplication()
        app.launch()
        
        // Tap the extension button
        if app.buttons["Enable Extension"].exists {
            app.buttons["Enable Extension"].tap()
        } else if app.buttons["Extension Settings"].exists {
            app.buttons["Extension Settings"].tap()
        } else {
            XCTFail("Extension button not found")
        }
        
        // Since this would open Safari settings, we can't verify much more in a UI test
        // Just verify the app is still running
        XCTAssertTrue(app.exists, "App should still be running after button tap")
    }
}