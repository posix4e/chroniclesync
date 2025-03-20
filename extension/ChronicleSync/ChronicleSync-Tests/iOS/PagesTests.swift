import XCTest
import SafariServices
import WebKit

class PagesTests: ChronicleExtensionBaseTest {
    
    func testShouldLoadSettingsPage() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open the app
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
        
        // Check for settings UI elements
        // This assumes your settings page has specific UI elements
        // You'll need to adjust based on your actual UI
        
        // Check for mnemonic field
        let mnemonicField = settingsApp.textFields["Mnemonic"]
        XCTAssertTrue(mnemonicField.exists, "Mnemonic field should exist")
        
        // Check for client ID field
        let clientIdField = settingsApp.textFields["Client ID"]
        XCTAssertTrue(clientIdField.exists, "Client ID field should exist")
        
        // Check for environment selector
        let environmentSelector = settingsApp.segmentedControls["Environment"]
        XCTAssertTrue(environmentSelector.exists, "Environment selector should exist")
        
        // Close settings
        settingsApp.terminate()
    }
    
    func testShouldLoadPopupPage() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open Safari and navigate to a test page
        openSafariAndNavigate(to: "https://example.com")
        
        // Open the extension from the share sheet
        safari.buttons["Share"].tap()
        safari.swipeUp()
        let extensionButton = safari.buttons["ChronicleSync"]
        extensionButton.tap()
        
        // Wait for extension UI to appear
        sleep(2)
        
        // Check for popup UI elements
        // This assumes your popup has specific UI elements
        // You'll need to adjust based on your actual UI
        
        // Check for title
        let titleElement = safari.staticTexts["ChronicleSync"]
        XCTAssertTrue(titleElement.exists, "Title should be displayed")
        
        // Check for admin login section
        let adminLoginElement = safari.staticTexts["Admin Login"]
        XCTAssertTrue(adminLoginElement.exists, "Admin Login section should be displayed")
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
    
    func testShouldLoadHistoryPage() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open Safari and navigate to a test page
        openSafariAndNavigate(to: "https://example.com")
        
        // Open the extension from the share sheet
        safari.buttons["Share"].tap()
        safari.swipeUp()
        let extensionButton = safari.buttons["ChronicleSync"]
        extensionButton.tap()
        
        // Wait for extension UI to appear
        sleep(2)
        
        // Navigate to history page
        if safari.buttons["History"].exists {
            safari.buttons["History"].tap()
            
            // Check for history UI elements
            // This assumes your history page has specific UI elements
            // You'll need to adjust based on your actual UI
            
            // Check for history table
            let historyTable = safari.tables["HistoryTable"]
            XCTAssertTrue(historyTable.exists, "History table should exist")
            
            // Check for search field
            let searchField = safari.searchFields.firstMatch
            XCTAssertTrue(searchField.exists, "Search field should exist")
            
            // Check for filter button
            let filterButton = safari.buttons["Filter"]
            XCTAssertTrue(filterButton.exists, "Filter button should exist")
        }
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
}