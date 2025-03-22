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
        let app = ChronicleSync()
        XCTAssertNotNil(app)
    }
    
    func testContentViewCreation() throws {
        // Test that ContentView can be created
        let contentView = ContentView()
        XCTAssertNotNil(contentView)
    }
    
    func testSettingsViewCreation() throws {
        // Test that SettingsView can be created
        let settingsView = SettingsView()
        XCTAssertNotNil(settingsView)
    }
    
    func testHowToEnableViewCreation() throws {
        // Test that HowToEnableView can be created with parameters
        let howToView = HowToEnableView(step: "1", title: "Test Title", description: "Test Description")
        XCTAssertNotNil(howToView)
        XCTAssertEqual(howToView.step, "1")
        XCTAssertEqual(howToView.title, "Test Title")
        XCTAssertEqual(howToView.description, "Test Description")
    }
    
    func testPerformanceExample() throws {
        // This is an example of a performance test case.
        measure {
            // Put the code you want to measure the time of here.
            _ = ContentView()
        }
    }
}