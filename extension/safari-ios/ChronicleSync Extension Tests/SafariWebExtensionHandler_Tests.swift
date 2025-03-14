import XCTest
@testable import ChronicleSync_Extension

class SafariWebExtensionHandler_Tests: XCTestCase {
    
    var handler: SafariWebExtensionHandler!
    
    override func setUpWithError() throws {
        handler = SafariWebExtensionHandler()
    }
    
    override func tearDownWithError() throws {
        handler = nil
    }
    
    func testHandlerInitialization() throws {
        XCTAssertNotNil(handler, "SafariWebExtensionHandler should not be nil")
    }
    
    func testMessageHandling() throws {
        // Create a simple expectation for async testing
        let expectation = XCTestExpectation(description: "Message handling")
        
        // Create a mock message
        let mockMessage = ["action": "test"]
        
        // Test message handling
        handler.beginRequest(with: mockMessage as NSObject) { response in
            XCTAssertNotNil(response, "Response should not be nil")
            expectation.fulfill()
        }
        
        // Wait for the expectation to be fulfilled
        wait(for: [expectation], timeout: 1.0)
    }
}