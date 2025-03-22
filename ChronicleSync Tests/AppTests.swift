import XCTest
@testable import ChronicleSync

class AppTests: XCTestCase {
    
    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
        continueAfterFailure = false
    }
    
    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }
    
    func testAppInitialization() throws {
        // Test that the app initializes correctly
        let app = ChronicleSync()
        XCTAssertNotNil(app)
    }
    
    func testContentView() throws {
        // Test that ContentView initializes correctly
        let contentView = ContentView()
        XCTAssertNotNil(contentView)
    }
    
    func testSettingsView() throws {
        // Test that SettingsView initializes correctly
        let settingsView = SettingsView()
        XCTAssertNotNil(settingsView)
    }
    
    func testSettingsStorage() throws {
        // Test settings storage functionality
        let settingsView = SettingsView()
        
        // Test default values
        XCTAssertEqual(settingsView.apiEndpoint, "https://api.chroniclesync.xyz")
        XCTAssertTrue(settingsView.syncEnabled)
        XCTAssertEqual(settingsView.syncInterval, 60.0)
        XCTAssertEqual(settingsView.maxHistoryItems, 1000)
        
        // Test changing values
        settingsView.apiEndpoint = "https://test-api.chroniclesync.xyz"
        settingsView.syncEnabled = false
        settingsView.syncInterval = 120.0
        settingsView.maxHistoryItems = 500
        
        XCTAssertEqual(settingsView.apiEndpoint, "https://test-api.chroniclesync.xyz")
        XCTAssertFalse(settingsView.syncEnabled)
        XCTAssertEqual(settingsView.syncInterval, 120.0)
        XCTAssertEqual(settingsView.maxHistoryItems, 500)
    }
}