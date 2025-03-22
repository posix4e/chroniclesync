import XCTest
@testable import ChronicleSync_iOS

class ChronicleSync_ExtensionTests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testSettingsSaving() throws {
        // Test that settings are properly saved to UserDefaults
        let defaults = UserDefaults.standard
        
        // Clear any existing settings
        defaults.removeObject(forKey: "chronicleSync_apiKey")
        defaults.removeObject(forKey: "chronicleSync_enableSync")
        
        // Set test values
        defaults.set("test_api_key_123", forKey: "chronicleSync_apiKey")
        defaults.set(true, forKey: "chronicleSync_enableSync")
        
        // Verify values were saved
        XCTAssertEqual(defaults.string(forKey: "chronicleSync_apiKey"), "test_api_key_123")
        XCTAssertTrue(defaults.bool(forKey: "chronicleSync_enableSync"))
    }
    
    func testPerformanceExample() throws {
        // This is an example of a performance test case.
        measure {
            // Put the code you want to measure the time of here.
        }
    }
}