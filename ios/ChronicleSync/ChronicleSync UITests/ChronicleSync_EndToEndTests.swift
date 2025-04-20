import XCTest

class ChronicleSync_EndToEndTests: XCTestCase {
    var app: XCUIApplication!
    var safari: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--use-production-api"]
        app.launch()
        
        // Initialize Safari
        safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
    }
    
    override func tearDownWithError() throws {
        app.terminate()
        safari.terminate()
    }
    
    func testFullSyncWorkflow() throws {
        // Step 1: Enable the extension in the app
        enableExtensionInSettings()
        
        // Step 2: Browse multiple websites in Safari
        browseWebsitesInSafari()
        
        // Step 3: Open extension popup and verify sync
        verifySyncInExtension()
        
        // Step 4: Verify data on server (if possible)
        verifyServerData()
    }
    
    // Helper methods
    private func enableExtensionInSettings() {
        // Take screenshot of the app
        let screenshot1 = XCUIScreen.main.screenshot()
        let attachment1 = XCTAttachment(screenshot: screenshot1)
        attachment1.name = "App_Launch"
        attachment1.lifetime = .keepAlways
        add(attachment1)
        
        // Open Settings
        let settingsApp = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
        settingsApp.launch()
        
        // Navigate to Safari > Extensions
        settingsApp.tables.cells["Safari"].tap()
        settingsApp.tables.cells["Extensions"].tap()
        
        // Enable ChronicleSync extension
        let extensionSwitch = settingsApp.switches["ChronicleSync"]
        if extensionSwitch.value as? String == "0" {
            extensionSwitch.tap()
        }
        
        // Take screenshot of enabled extension
        let screenshot2 = XCUIScreen.main.screenshot()
        let attachment2 = XCTAttachment(screenshot: screenshot2)
        attachment2.name = "Extension_Enabled"
        attachment2.lifetime = .keepAlways
        add(attachment2)
        
        settingsApp.terminate()
    }
    
    private func browseWebsitesInSafari() {
        // Launch Safari
        safari.launch()
        
        // Define test websites to visit
        let testSites = [
            "https://www.apple.com",
            "https://www.github.com",
            "https://www.wikipedia.org",
            "https://www.nytimes.com",
            "https://www.reddit.com"
        ]
        
        // Visit each website and wait for it to load
        for site in testSites {
            // Tap address bar
            safari.buttons["URL"].tap()
            
            // Clear existing text
            safari.textFields.element.clearText()
            
            // Enter URL
            safari.textFields.element.typeText(site + "\n")
            
            // Wait for page to load (adjust timeout as needed)
            let pageLoaded = safari.webViews.element.waitForExistence(timeout: 10)
            XCTAssertTrue(pageLoaded, "Failed to load \(site)")
            
            // Take screenshot of loaded page
            let screenshot = XCUIScreen.main.screenshot()
            let attachment = XCTAttachment(screenshot: screenshot)
            attachment.name = "Browsing_\(site.replacingOccurrences(of: "https://www.", with: ""))"
            attachment.lifetime = .keepAlways
            add(attachment)
            
            // Wait a moment to ensure the page visit is recorded
            sleep(2)
        }
    }
    
    private func verifySyncInExtension() {
        // Tap Safari's extension button (puzzle piece or aA button depending on iOS version)
        if safari.buttons["Extensions"].exists {
            safari.buttons["Extensions"].tap()
        } else if safari.buttons["aA"].exists {
            safari.buttons["aA"].tap()
            safari.buttons["Manage Extensions"].tap()
        }
        
        // Tap on ChronicleSync extension
        safari.buttons["ChronicleSync"].tap()
        
        // Wait for extension popup to appear
        let extensionPopup = safari.otherElements["chroniclesync-popup"]
        let popupExists = extensionPopup.waitForExistence(timeout: 5)
        XCTAssertTrue(popupExists, "Extension popup did not appear")
        
        // Take screenshot of extension popup
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "Extension_Popup"
        attachment.lifetime = .keepAlways
        add(attachment)
        
        // Verify sync status in the popup
        let syncStatus = extensionPopup.staticTexts["sync-status"]
        XCTAssertTrue(syncStatus.exists, "Sync status element not found")
        
        // Verify history items are present
        let historyItems = extensionPopup.tables["history-list"].cells
        XCTAssertGreaterThan(historyItems.count, 0, "No history items found in extension popup")
        
        // Trigger manual sync if available
        if extensionPopup.buttons["sync-now"].exists {
            extensionPopup.buttons["sync-now"].tap()
            
            // Wait for sync to complete
            sleep(5)
            
            // Take another screenshot after sync
            let syncScreenshot = XCUIScreen.main.screenshot()
            let syncAttachment = XCTAttachment(screenshot: syncScreenshot)
            syncAttachment.name = "After_Manual_Sync"
            syncAttachment.lifetime = .keepAlways
            add(syncAttachment)
        }
    }
    
    private func verifyServerData() {
        // Launch the app again to use its API client
        app.terminate()
        app.launch()
        
        // Tap on a special "Verify Sync" button added for testing
        app.buttons["verify-sync-button"].tap()
        
        // Wait for verification to complete
        let verificationResult = app.staticTexts["verification-result"]
        let resultExists = verificationResult.waitForExistence(timeout: 10)
        XCTAssertTrue(resultExists, "Verification result not found")
        
        // Check if verification was successful
        XCTAssertEqual(verificationResult.label, "Sync Verified", "Server data verification failed")
        
        // Take screenshot of verification result
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "Server_Verification"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}

extension XCUIElement {
    func clearText() {
        guard let stringValue = self.value as? String else {
            return
        }
        
        // Select all and delete
        self.tap()
        self.press(forDuration: 1.0)
        
        if self.buttons["Select All"].exists {
            self.buttons["Select All"].tap()
            self.typeText("")
        } else {
            // Fallback: delete each character
            let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: stringValue.count)
            self.typeText(deleteString)
        }
    }
}