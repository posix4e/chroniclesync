import XCTest
@testable import ChronicleSync

class ChronicleSync_Tests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testAppLaunch() throws {
        // This is a basic test to verify the app launches successfully
        let app = XCUIApplication()
        app.launch()
        
        // Verify the app title is displayed
        XCTAssertTrue(app.staticTexts["ChronicleSync Safari Extension"].exists)
        
        // Verify the enable extension button is displayed
        XCTAssertTrue(app.buttons["Enable Extension"].exists || app.buttons["Extension Settings"].exists)
    }
}