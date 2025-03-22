import XCTest
@testable import ChronicleSync_Safari

class ChronicleSync_SafariTests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testAppInitialization() throws {
        // Test that the app initializes correctly
        let app = UIApplication.shared
        XCTAssertNotNil(app, "App should initialize")
    }
    
    func testViewControllerLoads() throws {
        // Test that the main view controller loads correctly
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        let viewController = storyboard.instantiateInitialViewController() as? ViewController
        
        XCTAssertNotNil(viewController, "ViewController should be instantiated from storyboard")
        
        // Load the view hierarchy
        _ = viewController?.view
        
        // Check that outlets are connected
        XCTAssertNotNil(viewController?.enableExtensionButton, "Enable extension button should be connected")
        XCTAssertNotNil(viewController?.statusLabel, "Status label should be connected")
    }
}