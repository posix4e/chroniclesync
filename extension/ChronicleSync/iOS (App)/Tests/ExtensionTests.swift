import XCTest
import SafariServices
import WebKit

class ExtensionTests: ChronicleExtensionBaseTest {
    
    func testExtensionShouldBeLoaded() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open Safari and navigate to a test page
        openSafariAndNavigate(to: "https://example.com")
        
        // Verify the extension is loaded by checking for its UI elements
        // In Safari, tap the share button
        safari.buttons["Share"].tap()
        
        // Swipe up to see more options
        safari.swipeUp()
        
        // Look for our extension in the share sheet
        let extensionButton = safari.buttons["ChronicleSync"]
        XCTAssertTrue(extensionButton.exists, "Extension button should be visible in share sheet")
        
        // Dismiss the share sheet
        safari.tap() // Tap outside to dismiss
    }
    
    func testAPIHealthCheckShouldBeSuccessful() {
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
        
        // Check if we have settings UI elements
        // Note: This is an approximation as we don't know the exact UI structure
        // You'll need to adjust based on your actual UI
        
        // Look for a mnemonic field
        let mnemonicField = settingsApp.textFields["Mnemonic"]
        if mnemonicField.exists && mnemonicField.value as? String == "" {
            // Generate a new mnemonic if empty
            settingsApp.buttons["Generate Mnemonic"].tap()
        }
        
        // Check for client ID
        let clientIdField = settingsApp.textFields["Client ID"]
        XCTAssertTrue(clientIdField.exists, "Client ID field should exist")
        XCTAssertFalse(clientIdField.value as? String == "", "Client ID should not be empty")
        
        // Save settings if there's a save button
        if settingsApp.buttons["Save"].exists {
            settingsApp.buttons["Save"].tap()
        }
        
        // Return to the app
        settingsApp.terminate()
        app.activate()
        
        // Check for health status in the app
        // This assumes your app has a way to display API health status
        // You'll need to adjust based on your actual UI
        let statusLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'health'")).firstMatch
        XCTAssertTrue(statusLabel.exists, "Health status should be displayed")
        
        // Alternatively, if your app doesn't show health status directly,
        // you could check for absence of error messages
        let errorMessage = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'error'")).firstMatch
        XCTAssertFalse(errorMessage.exists, "No error messages should be displayed")
    }
    
    func testShouldLoadWithoutErrors() {
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
        
        // Check for error messages in the extension UI
        // This assumes your extension displays error messages in a specific way
        // You'll need to adjust based on your actual UI
        let errorMessage = safari.staticTexts.matching(NSPredicate(format: "label CONTAINS 'error'")).firstMatch
        XCTAssertFalse(errorMessage.exists, "No error messages should be displayed")
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
    
    func testPopupShouldLoadCorrectly() {
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
        
        // Check for expected UI elements
        // This assumes your extension has specific UI elements
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
}