import XCTest
@testable import ChronicleSync

class ChronicleSync_Tests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testAppInitialization() throws {
        // Test that the app initializes correctly
        let app = XCUIApplication()
        app.launch()
        
        // Verify that the main UI elements are present
        XCTAssertTrue(app.staticTexts["ChronicleSync"].exists)
        XCTAssertTrue(app.buttons["Enable Extension"].exists || app.buttons["Extension Settings"].exists)
        XCTAssertTrue(app.buttons["Open Safari"].exists)
    }
    
    func testExtensionBundleIdentifier() {
        // Test that the extension bundle identifier is correctly determined
        let viewController = ViewController()
        
        // Use the reflection to access the private method
        let selector = NSSelectorFromString("getExtensionBundleIdentifier")
        if viewController.responds(to: selector) {
            let method = viewController.method(for: selector)
            let implementation = method_getImplementation(method!)
            let function = unsafeBitCast(implementation, to: (@convention(c) (Any, Selector) -> String).self)
            let bundleId = function(viewController, selector)
            
            // Verify that the bundle ID is in the expected format
            XCTAssertTrue(bundleId.hasSuffix(".extension"))
        } else {
            XCTFail("Method getExtensionBundleIdentifier not found")
        }
    }
}