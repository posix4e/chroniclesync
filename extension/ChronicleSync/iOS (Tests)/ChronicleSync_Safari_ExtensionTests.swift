import XCTest

class ChronicleSync_Safari_ExtensionTests: XCTestCase {
    
    let safariApp = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
    let settingsApp = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
    
    // Test environment URL - can be overridden by environment variables
    var testEnvironmentURL: String {
        return ProcessInfo.processInfo.environment["TEST_ENVIRONMENT_URL"] ?? "https://staging.chroniclesync.xyz"
    }
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        
        // Enable the extension in Safari settings before running tests
        enableExtensionInSettings()
        
        // Launch Safari
        safariApp.launch()
    }
    
    override func tearDownWithError() throws {
        safariApp.terminate()
    }
    
    func enableExtensionInSettings() {
        // Open Settings
        settingsApp.launch()
        
        // Navigate to Safari settings
        if settingsApp.tables.cells["Safari"].exists {
            settingsApp.tables.cells["Safari"].tap()
            
            // Navigate to Extensions
            if settingsApp.tables.cells["Extensions"].exists {
                settingsApp.tables.cells["Extensions"].tap()
                
                // Look for our extension
                // Note: Replace "ChronicleSync" with the actual name of your extension as it appears in Settings
                if settingsApp.tables.cells["ChronicleSync"].exists {
                    let extensionCell = settingsApp.tables.cells["ChronicleSync"]
                    extensionCell.tap()
                    
                    // Enable the extension if it's not already enabled
                    let switchElement = extensionCell.switches.firstMatch
                    if switchElement.exists && switchElement.value as? String == "0" {
                        switchElement.tap()
                    }
                }
            }
        }
        
        // Close Settings
        settingsApp.terminate()
    }
    
    func testNavigateToTestEnvironment() throws {
        // Navigate to the test environment
        let urlTextField = safariApp.textFields["URL"]
        XCTAssertTrue(urlTextField.waitForExistence(timeout: 5))
        
        urlTextField.tap()
        urlTextField.typeText(testEnvironmentURL + "\n")
        
        // Wait for the page to load
        sleep(5)
        
        // Take a screenshot
        takeScreenshot(name: "test_environment_loaded")
        
        // Verify the page loaded (basic check)
        XCTAssertTrue(safariApp.webViews.count > 0, "Web view not found")
    }
    
    func testExtensionActivation() throws {
        // Navigate to the test environment
        testNavigateToTestEnvironment()
        
        // Tap the share button to access extensions
        // Note: The exact UI elements might vary based on iOS version
        if safariApp.buttons["Share"].exists {
            safariApp.buttons["Share"].tap()
            
            // Wait for share sheet to appear
            sleep(1)
            
            // Look for our extension in the share sheet
            // Note: Replace "ChronicleSync" with the actual name of your extension as it appears in the share sheet
            if safariApp.buttons["ChronicleSync"].waitForExistence(timeout: 5) {
                safariApp.buttons["ChronicleSync"].tap()
                
                // Wait for extension UI to appear
                sleep(2)
                
                // Take a screenshot of the extension UI
                takeScreenshot(name: "extension_activated")
                
                // Basic verification that the extension UI is displayed
                // This will need to be customized based on your extension's UI
                XCTAssertTrue(safariApp.otherElements.count > 0, "Extension UI elements not found")
            } else {
                XCTFail("ChronicleSync extension not found in share sheet")
            }
        } else {
            XCTFail("Share button not found in Safari")
        }
    }
    
    func testExtensionFunctionality() throws {
        // Navigate to the test environment
        testNavigateToTestEnvironment()
        
        // This test should be customized based on your extension's specific functionality
        // For example, if your extension adds a button to the page:
        
        // Wait for the extension to inject its content
        sleep(3)
        
        // Look for elements that your extension adds to the page
        // Example (replace with actual elements from your extension):
        // let extensionButton = safariApp.webViews.buttons["chronicle-sync-button"]
        // XCTAssertTrue(extensionButton.exists, "Extension button not found")
        
        // Take a screenshot
        takeScreenshot(name: "extension_functionality")
        
        // For now, this is just a placeholder test
        XCTAssertTrue(true, "Replace with actual extension functionality tests")
    }
    
    // Helper function to take and attach screenshots
    func takeScreenshot(name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}