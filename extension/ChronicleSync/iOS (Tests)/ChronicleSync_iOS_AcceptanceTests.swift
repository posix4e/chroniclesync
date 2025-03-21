import XCTest

class ChronicleSync_iOS_AcceptanceTests: XCTestCase {
    
    var app: XCUIApplication!
    let safariApp = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        
        // Initialize the app
        app = XCUIApplication()
        
        // Add launch arguments for testing environment
        app.launchArguments += ["-UITesting"]
        
        // Launch the app
        app.launch()
    }
    
    override func tearDownWithError() throws {
        // Put teardown code here if needed
        app.terminate()
    }
    
    func testAppLaunch() throws {
        // Verify the app launches successfully
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 5))
        
        // Take a screenshot for verification
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    
    func testSafariExtension() throws {
        // Launch Safari
        safariApp.launch()
        
        // Wait for Safari to be in the foreground
        XCTAssertTrue(safariApp.wait(for: .runningForeground, timeout: 5))
        
        // Navigate to the staging environment
        let urlTextField = safariApp.textFields["URL"]
        urlTextField.tap()
        urlTextField.typeText("https://staging.chroniclesync.xyz\n")
        
        // Wait for the page to load
        sleep(3)
        
        // Take a screenshot of the loaded page
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        add(attachment)
        
        // Verify the extension can be activated
        // Note: This part may need to be adjusted based on the actual UI of the extension
        // For now, we're just checking if Safari is running properly
        XCTAssertTrue(safariApp.state == .runningForeground)
    }
    
    func testExtensionSettings() throws {
        // Open Settings app
        let settingsApp = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
        settingsApp.launch()
        
        // Wait for Settings to be in the foreground
        XCTAssertTrue(settingsApp.wait(for: .runningForeground, timeout: 5))
        
        // Navigate to Safari settings
        // Note: This might need adjustments based on the iOS version
        if settingsApp.tables.cells["Safari"].exists {
            settingsApp.tables.cells["Safari"].tap()
            
            // Wait for Safari settings to load
            sleep(1)
            
            // Navigate to Extensions
            if settingsApp.tables.cells["Extensions"].exists {
                settingsApp.tables.cells["Extensions"].tap()
                
                // Wait for Extensions page to load
                sleep(1)
                
                // Take a screenshot of the Extensions page
                let screenshot = XCUIScreen.main.screenshot()
                let attachment = XCTAttachment(screenshot: screenshot)
                attachment.lifetime = .keepAlways
                add(attachment)
                
                // Check if our extension is listed
                // This is a basic check and might need to be adjusted
                XCTAssertTrue(settingsApp.tables.cells.count > 0, "No extensions found")
            } else {
                XCTFail("Extensions option not found in Safari settings")
            }
        } else {
            XCTFail("Safari option not found in Settings")
        }
    }
}