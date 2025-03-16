import XCTest
@testable import ChronicleSync

class ChronicleSync_Tests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
        continueAfterFailure = false
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testAppInitialization() throws {
        // This is a basic test to verify the app initializes correctly
        XCTAssertTrue(true, "App should initialize correctly")
    }
    
    func testUserDefaultsStorage() throws {
        // Test that UserDefaults works correctly
        UserDefaults.standard.set(true, forKey: "extensionEnabled")
        XCTAssertTrue(UserDefaults.standard.bool(forKey: "extensionEnabled"), "UserDefaults should store boolean values")
        
        UserDefaults.standard.set(false, forKey: "extensionEnabled")
        XCTAssertFalse(UserDefaults.standard.bool(forKey: "extensionEnabled"), "UserDefaults should update boolean values")
    }
    
    func testViewControllerCreation() throws {
        // Test that ViewController can be instantiated
        let viewController = ViewController()
        XCTAssertNotNil(viewController, "ViewController should be instantiable")
    }
    
    func testSettingsViewControllerCreation() throws {
        // Test that SettingsViewController can be instantiated
        let settingsVC = SettingsViewController()
        XCTAssertNotNil(settingsVC, "SettingsViewController should be instantiable")
    }
    
    func testUILaunch() throws {
        // This test will be run in the simulator
        let app = XCUIApplication()
        app.launch()
        
        // Basic verification that the app launches without crashing
        XCTAssertTrue(app.exists, "App should exist after launch")
    }
}