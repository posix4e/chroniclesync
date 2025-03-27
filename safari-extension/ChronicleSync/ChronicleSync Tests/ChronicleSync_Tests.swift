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
        let viewController = ViewController()
        XCTAssertNotNil(viewController.view)
        
        // Load the view if it's not already loaded
        _ = viewController.view
        
        // Verify UI elements are set up correctly
        let instructionsLabel = viewController.value(forKey: "instructionsLabel") as? UILabel
        XCTAssertNotNil(instructionsLabel)
        XCTAssertTrue(instructionsLabel?.text?.contains("Welcome to ChronicleSync Safari Extension!") ?? false)
        
        let enableExtensionButton = viewController.value(forKey: "enableExtensionButton") as? UIButton
        XCTAssertNotNil(enableExtensionButton)
        XCTAssertEqual(enableExtensionButton?.title(for: .normal), "Open Safari Settings")
    }
}