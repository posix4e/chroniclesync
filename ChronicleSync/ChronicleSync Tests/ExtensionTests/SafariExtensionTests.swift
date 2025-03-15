import XCTest
@testable import ChronicleSync_Extension

class SafariExtensionTests: XCTestCase {
    
    var extensionHandler: SafariWebExtensionHandler!
    
    override func setUp() {
        super.setUp()
        extensionHandler = SafariWebExtensionHandler()
        
        // Clear any existing test data
        UserDefaults.standard.removeObject(forKey: "syncHistories")
        UserDefaults.standard.removeObject(forKey: "lastSync")
    }
    
    override func tearDown() {
        extensionHandler = nil
        super.tearDown()
    }
    
    func testSaveHistory() {
        // Create a mock extension context
        let mockContext = MockExtensionContext()
        
        // Create a history item to save
        let historyData: [String: Any] = [
            "url": "https://example.com",
            "title": "Example Website",
            "timestamp": Date().timeIntervalSince1970,
            "textContent": "This is an example website"
        ]
        
        // Create the message
        let message: [String: Any] = [
            "type": "SAVE_HISTORY",
            "data": historyData
        ]
        
        // Create the extension item with the message
        let item = NSExtensionItem()
        item.userInfo = [SFExtensionMessageKey: message]
        mockContext.inputItems = [item]
        
        // Call beginRequest
        extensionHandler.beginRequest(with: mockContext)
        
        // Wait for async processing
        let expectation = XCTestExpectation(description: "Process message")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            expectation.fulfill()
        }
        wait(for: [expectation], timeout: 1.0)
        
        // Verify the response
        XCTAssertEqual(mockContext.completeRequestCalled, true)
        XCTAssertEqual(mockContext.returnedItems?.count, 1)
        
        // Verify that the history was saved
        let histories = UserDefaults.standard.dictionary(forKey: "syncHistories") as? [String: Any]
        XCTAssertNotNil(histories)
        XCTAssertEqual(histories?.count, 1)
        
        // Verify that the last sync time was updated
        XCTAssertNotNil(UserDefaults.standard.object(forKey: "lastSync"))
    }
    
    func testGetSettings() {
        // Set up test settings
        UserDefaults.standard.set(true, forKey: "syncEnabled")
        
        // Create a mock extension context
        let mockContext = MockExtensionContext()
        
        // Create the message
        let message: [String: Any] = [
            "type": "GET_SETTINGS"
        ]
        
        // Create the extension item with the message
        let item = NSExtensionItem()
        item.userInfo = [SFExtensionMessageKey: message]
        mockContext.inputItems = [item]
        
        // Call beginRequest
        extensionHandler.beginRequest(with: mockContext)
        
        // Wait for async processing
        let expectation = XCTestExpectation(description: "Process message")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            expectation.fulfill()
        }
        wait(for: [expectation], timeout: 1.0)
        
        // Verify the response
        XCTAssertEqual(mockContext.completeRequestCalled, true)
        XCTAssertEqual(mockContext.returnedItems?.count, 1)
        
        // Verify the settings in the response
        if let responseItem = mockContext.returnedItems?.first as? NSExtensionItem,
           let response = responseItem.userInfo?[SFExtensionMessageKey] as? [String: Any],
           let settings = response["settings"] as? [String: Any] {
            XCTAssertEqual(settings["syncEnabled"] as? Bool, true)
            XCTAssertEqual(settings["apiEndpoint"] as? String, "https://api.chroniclesync.xyz")
        } else {
            XCTFail("Failed to get settings from response")
        }
    }
}

// Mock NSExtensionContext for testing
class MockExtensionContext: NSExtensionContext {
    var inputItems: [NSExtensionItem] = []
    var returnedItems: [NSExtensionItem]?
    var completeRequestCalled = false
    
    override var inputItems: [Any] {
        return self.inputItems
    }
    
    override func completeRequest(returningItems items: [Any]?, completionHandler: ((Bool) -> Void)?) {
        self.returnedItems = items as? [NSExtensionItem]
        self.completeRequestCalled = true
        completionHandler?(true)
    }
}