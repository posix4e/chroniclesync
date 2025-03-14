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
        let appDelegate = AppDelegate()
        XCTAssertNotNil(appDelegate, "AppDelegate should not be nil")
    }
    
    func testViewControllerLoading() throws {
        // Test that the ViewController loads correctly
        let viewController = ViewController()
        viewController.loadViewIfNeeded()
        XCTAssertNotNil(viewController.view, "View should be loaded")
    }
}