import XCTest
@testable import ChronicleSync

final class ChronicleSync_Tests: XCTestCase {
    
    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }
    
    func testAppInitialization() throws {
        // Test that the app initializes correctly
        let viewController = ViewController()
        XCTAssertNotNil(viewController, "ViewController should be created")
    }
    
    func testExtensionInitialization() throws {
        // Test that the extension initializes correctly
        let chronicleSync = ChronicleSync.shared
        XCTAssertNotNil(chronicleSync, "ChronicleSync should be created")
    }
}