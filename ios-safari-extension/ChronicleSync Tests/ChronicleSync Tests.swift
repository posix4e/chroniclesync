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
        XCTAssertNotNil(ChronicleSync())
    }
    
    func testContentViewRendering() throws {
        // Test that ContentView renders correctly
        let contentView = ContentView()
        XCTAssertNotNil(contentView)
    }
    
    // This test is intentionally failing to verify our workflow changes
    // Comment out this test to make the workflow pass
    func testIntentionallyFailing() throws {
        // This test will fail to verify our workflow changes
        XCTFail("This test is intentionally failing to verify that the workflow fails when tests fail")
    }
}