import XCTest
@testable import ChronicleSync

class SafariWebExtensionHandlerTests: XCTestCase {
    
    var extensionHandler: SafariWebExtensionHandler!
    
    override func setUp() {
        super.setUp()
        extensionHandler = SafariWebExtensionHandler()
    }
    
    override func tearDown() {
        extensionHandler = nil
        super.tearDown()
    }
    
    // Test that the handler can process a sync history command
    func testHandleSyncHistory() {
        // Create a mock extension context
        let mockContext = MockExtensionContext()
        
        // Create a mock input item with a sync history command
        let inputItem = NSExtensionItem()
        let message = ["command": "syncHistory"]
        inputItem.userInfo = [SFExtensionMessageKey: message]
        mockContext.inputItems = [inputItem]
        
        // Call the handler
        extensionHandler.beginRequest(with: mockContext)
        
        // Wait for async operations to complete
        let expectation = XCTestExpectation(description: "History sync completed")
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            expectation.fulfill()
        }
        wait(for: [expectation], timeout: 3.0)
        
        // Verify that a response was sent
        XCTAssertTrue(mockContext.completeRequestCalled)
        XCTAssertNotNil(mockContext.returnedItems)
        XCTAssertEqual(mockContext.returnedItems?.count, 1)
        
        // Verify the response contains the expected data
        if let responseItem = mockContext.returnedItems?.first as? NSExtensionItem,
           let responseDict = responseItem.userInfo?[SFExtensionMessageKey] as? [String: Any] {
            XCTAssertTrue(responseDict["success"] as? Bool ?? false)
            XCTAssertNotNil(responseDict["data"])
        } else {
            XCTFail("Response does not contain expected data")
        }
    }
    
    // Test that the handler properly handles unknown commands
    func testHandleUnknownCommand() {
        // Create a mock extension context
        let mockContext = MockExtensionContext()
        
        // Create a mock input item with an unknown command
        let inputItem = NSExtensionItem()
        let message = ["command": "unknownCommand"]
        inputItem.userInfo = [SFExtensionMessageKey: message]
        mockContext.inputItems = [inputItem]
        
        // Call the handler
        extensionHandler.beginRequest(with: mockContext)
        
        // Verify that an error response was sent
        XCTAssertTrue(mockContext.completeRequestCalled)
        XCTAssertNotNil(mockContext.returnedItems)
        XCTAssertEqual(mockContext.returnedItems?.count, 1)
        
        // Verify the response contains an error message
        if let responseItem = mockContext.returnedItems?.first as? NSExtensionItem,
           let responseDict = responseItem.userInfo?[SFExtensionMessageKey] as? [String: Any] {
            XCTAssertNotNil(responseDict["error"])
        } else {
            XCTFail("Response does not contain expected error")
        }
    }
}

// Mock NSExtensionContext for testing
class MockExtensionContext: NSExtensionContext {
    var inputItems: [Any] = []
    var returnedItems: [Any]?
    var completionHandler: (() -> Void)?
    var completeRequestCalled = false
    
    override var inputItems: [Any] {
        get { return self.inputItems }
        set { self.inputItems = newValue }
    }
    
    override func completeRequest(returningItems items: [Any]?, completionHandler: (() -> Void)?) {
        self.returnedItems = items
        self.completionHandler = completionHandler
        self.completeRequestCalled = true
        completionHandler?()
    }
}