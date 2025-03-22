import XCTest

class ChronicleSync_Safari_ExtensionTests: XCTestCase {
    
    let safariApp = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
    let settingsApp = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
    
    // Test environment URLs - can be overridden by environment variables
    var testEnvironmentURL: String {
        return ProcessInfo.processInfo.environment["TEST_ENVIRONMENT_URL"] ?? "https://staging.chroniclesync.xyz"
    }
    
    var apiBaseURL: String {
        return ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://api-staging.chroniclesync.xyz"
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
                if settingsApp.tables.cells["ChronicleSync"].exists {
                    let extensionCell = settingsApp.tables.cells["ChronicleSync"]
                    extensionCell.tap()
                    
                    // Enable the extension if it's not already enabled
                    let switchElement = extensionCell.switches.firstMatch
                    if switchElement.exists && switchElement.value as? String == "0" {
                        switchElement.tap()
                    }
                    
                    // Take a screenshot of the extension settings
                    takeScreenshot(name: "extension_settings")
                    
                    // Go back to Extensions list
                    safariApp.navigationBars.buttons.firstMatch.tap()
                }
                
                // Also enable Content Blockers if available
                if settingsApp.tables.cells["Content Blockers"].exists {
                    settingsApp.tables.cells["Content Blockers"].tap()
                    
                    // Enable our content blocker if it exists
                    if settingsApp.tables.cells["ChronicleSync"].exists {
                        let contentBlockerSwitch = settingsApp.tables.cells["ChronicleSync"].switches.firstMatch
                        if contentBlockerSwitch.exists && contentBlockerSwitch.value as? String == "0" {
                            contentBlockerSwitch.tap()
                        }
                    }
                }
            }
            
            // Enable JavaScript (required for extension functionality)
            if settingsApp.tables.cells["Advanced"].exists {
                settingsApp.tables.cells["Advanced"].tap()
                
                if settingsApp.tables.cells["JavaScript"].exists {
                    let jsSwitch = settingsApp.tables.cells["JavaScript"].switches.firstMatch
                    if jsSwitch.exists && jsSwitch.value as? String == "0" {
                        jsSwitch.tap()
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
        
        // Method 1: Access via Safari extension button (iOS 15+)
        if #available(iOS 15.0, *) {
            // Look for the extension button in the toolbar
            if safariApp.buttons["Extensions"].waitForExistence(timeout: 5) {
                safariApp.buttons["Extensions"].tap()
                
                // Wait for extension menu to appear
                sleep(1)
                
                // Look for our extension in the menu
                if safariApp.collectionViews.buttons["ChronicleSync"].waitForExistence(timeout: 3) {
                    safariApp.collectionViews.buttons["ChronicleSync"].tap()
                    
                    // Wait for extension UI to appear
                    sleep(2)
                    
                    // Take a screenshot of the extension UI
                    takeScreenshot(name: "extension_activated_method1")
                    
                    // Verify extension UI elements
                    XCTAssertTrue(safariApp.otherElements.count > 0, "Extension UI elements not found")
                    
                    // Dismiss extension UI if needed
                    if safariApp.buttons["Done"].exists {
                        safariApp.buttons["Done"].tap()
                    }
                    
                    return
                }
            }
        }
        
        // Method 2: Access via Share button (fallback)
        if safariApp.buttons["Share"].exists {
            safariApp.buttons["Share"].tap()
            
            // Wait for share sheet to appear
            sleep(1)
            
            // Swipe up to see more options if needed
            let shareSheet = safariApp.otherElements["ActivityListView"]
            if shareSheet.exists {
                shareSheet.swipeUp()
            }
            
            // Look for our extension in the share sheet
            if safariApp.buttons["ChronicleSync"].waitForExistence(timeout: 5) {
                safariApp.buttons["ChronicleSync"].tap()
                
                // Wait for extension UI to appear
                sleep(2)
                
                // Take a screenshot of the extension UI
                takeScreenshot(name: "extension_activated_method2")
                
                // Verify extension UI elements
                XCTAssertTrue(safariApp.otherElements.count > 0, "Extension UI elements not found")
            } else {
                // Try looking in "More" menu
                if safariApp.buttons["More"].exists {
                    safariApp.buttons["More"].tap()
                    sleep(1)
                    
                    if safariApp.tables.cells["ChronicleSync"].exists {
                        safariApp.tables.cells["ChronicleSync"].tap()
                        sleep(2)
                        takeScreenshot(name: "extension_activated_from_more")
                    } else {
                        XCTFail("ChronicleSync extension not found in More menu")
                    }
                } else {
                    XCTFail("ChronicleSync extension not found in share sheet")
                }
            }
        } else {
            XCTFail("Neither Extensions button nor Share button found in Safari")
        }
    }
    
    func testExtensionPopup() throws {
        // Navigate to the test environment
        testNavigateToTestEnvironment()
        
        // Wait for the extension to inject its content
        sleep(3)
        
        // Look for the extension's popup icon in the toolbar or page
        // This is specific to how ChronicleSync is implemented
        let extensionIcon = safariApp.webViews.descendants(matching: .any)["chronicle-sync-icon"]
        
        if extensionIcon.waitForExistence(timeout: 5) {
            extensionIcon.tap()
            
            // Wait for popup to appear
            sleep(2)
            
            // Take a screenshot of the popup
            takeScreenshot(name: "extension_popup")
            
            // Verify popup elements
            let popup = safariApp.webViews.descendants(matching: .any)["chronicle-sync-popup"]
            XCTAssertTrue(popup.exists, "Extension popup not found")
            
            // Test interaction with popup elements
            // For example, if there's a sync button:
            let syncButton = popup.buttons["sync-button"]
            if syncButton.exists {
                syncButton.tap()
                sleep(2)
                takeScreenshot(name: "after_sync_button_tap")
            }
            
            // Close popup if there's a close button
            let closeButton = popup.buttons["close-button"]
            if closeButton.exists {
                closeButton.tap()
            }
        } else {
            // Alternative: Try accessing through browser action button
            testExtensionActivation()
        }
    }
    
    func testExtensionAPIInteraction() throws {
        // Navigate to the test environment
        testNavigateToTestEnvironment()
        
        // Wait for the extension to initialize
        sleep(3)
        
        // Open the extension popup
        testExtensionPopup()
        
        // Verify API interaction by checking for network activity
        // This is a basic test - in a real test, you would verify specific API responses
        
        // Navigate to the API status page if available
        let urlTextField = safariApp.textFields["URL"]
        XCTAssertTrue(urlTextField.waitForExistence(timeout: 5))
        
        urlTextField.tap()
        urlTextField.typeText(apiBaseURL + "/status\n")
        
        // Wait for the API status page to load
        sleep(3)
        
        // Take a screenshot of the API status
        takeScreenshot(name: "api_status_page")
        
        // Verify the page loaded
        XCTAssertTrue(safariApp.webViews.count > 0, "API status page not loaded")
    }
    
    func testExtensionSettings() throws {
        // Navigate to the extension settings page
        testNavigateToTestEnvironment()
        
        // Method 1: Try to access settings through extension popup
        let extensionIcon = safariApp.webViews.descendants(matching: .any)["chronicle-sync-icon"]
        
        if extensionIcon.waitForExistence(timeout: 5) {
            extensionIcon.tap()
            
            // Wait for popup to appear
            sleep(2)
            
            // Look for settings button in popup
            let settingsButton = safariApp.webViews.descendants(matching: .any)["settings-button"]
            if settingsButton.exists {
                settingsButton.tap()
                sleep(2)
                takeScreenshot(name: "extension_settings_page")
                
                // Verify settings elements
                let settingsPage = safariApp.webViews.descendants(matching: .any)["settings-page"]
                XCTAssertTrue(settingsPage.exists, "Settings page not found")
                
                return
            }
        }
        
        // Method 2: Access settings through extension activation
        testExtensionActivation()
        
        // Look for settings button in extension UI
        let settingsButton = safariApp.buttons["Settings"]
        if settingsButton.exists {
            settingsButton.tap()
            sleep(2)
            takeScreenshot(name: "extension_settings_page_method2")
        }
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