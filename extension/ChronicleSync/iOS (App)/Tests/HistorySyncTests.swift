import XCTest
import SafariServices
import WebKit

class HistorySyncTests: ChronicleExtensionBaseTest {
    
    func testShouldSyncBrowserHistoryWithAPI() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open the app to configure settings
        app.launch()
        
        // Open settings
        openExtensionSettings()
        
        // Navigate to the extension settings in the Settings app
        let settingsApp = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
        
        // Wait for settings to appear
        XCTAssert(settingsApp.wait(for: .runningForeground, timeout: 5))
        
        // Navigate to Safari > Extensions > Our Extension
        settingsApp.tables.cells["Safari"].tap()
        settingsApp.tables.cells["Extensions"].tap()
        settingsApp.tables.cells.containing(.staticText, identifier: "ChronicleSync").element.tap()
        
        // Generate a new mnemonic if needed
        if settingsApp.buttons["Generate Mnemonic"].exists {
            settingsApp.buttons["Generate Mnemonic"].tap()
        }
        
        // Set custom API URL if needed
        // This assumes your settings UI has a way to select environment and enter custom URL
        // You'll need to adjust based on your actual UI
        if settingsApp.segmentedControls["Environment"].exists {
            settingsApp.segmentedControls["Environment"].buttons["Custom"].tap()
            
            let customUrlField = settingsApp.textFields["Custom API URL"]
            if customUrlField.exists {
                customUrlField.tap()
                customUrlField.clearText()
                customUrlField.typeText("https://api-staging.chroniclesync.xyz")
            }
        }
        
        // Save settings if there's a save button
        if settingsApp.buttons["Save"].exists {
            settingsApp.buttons["Save"].tap()
        }
        
        // Return to Safari
        settingsApp.terminate()
        
        // Open Safari and visit test URLs to generate history
        openSafariAndNavigate(to: "https://example.com")
        
        // Wait for sync to occur (we added a 1s delay in background.js)
        sleep(2)
        
        // Open another test page
        openSafariAndNavigate(to: "https://mozilla.org")
        sleep(2)
        
        // Open the extension to verify sync status
        safari.buttons["Share"].tap()
        safari.swipeUp()
        let extensionButton = safari.buttons["ChronicleSync"]
        extensionButton.tap()
        
        // Wait for extension UI to appear
        sleep(2)
        
        // Check for sync status in the extension UI
        // This assumes your extension displays sync status in a specific way
        // You'll need to adjust based on your actual UI
        let statusText = safari.staticTexts.matching(NSPredicate(format: "label CONTAINS 'Last sync'")).firstMatch
        XCTAssertTrue(statusText.exists, "Sync status should be displayed")
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
    
    func testShouldHandleMultipleTabsAndWindows() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open Safari and navigate to a test page
        openSafariAndNavigate(to: "https://example.com")
        
        // Open a new tab
        safari.buttons["New Tab"].tap()
        openSafariAndNavigate(to: "https://mozilla.org")
        
        // Open another new tab
        safari.buttons["New Tab"].tap()
        openSafariAndNavigate(to: "https://github.com")
        
        // Wait for sync to occur
        sleep(3)
        
        // Open the extension to verify sync status
        safari.buttons["Share"].tap()
        safari.swipeUp()
        let extensionButton = safari.buttons["ChronicleSync"]
        extensionButton.tap()
        
        // Wait for extension UI to appear
        sleep(2)
        
        // Check for sync status in the extension UI
        let statusText = safari.staticTexts.matching(NSPredicate(format: "label CONTAINS 'Last sync'")).firstMatch
        XCTAssertTrue(statusText.exists, "Sync status should be displayed")
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
}