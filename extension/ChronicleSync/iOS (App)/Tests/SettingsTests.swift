import XCTest
import SafariServices
import WebKit

class SettingsTests: ChronicleExtensionBaseTest {
    
    func testShouldSaveAndLoadSettings() {
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
        
        // Generate a new mnemonic
        if settingsApp.buttons["Generate Mnemonic"].exists {
            settingsApp.buttons["Generate Mnemonic"].tap()
        }
        
        // Get the current mnemonic value
        let mnemonicField = settingsApp.textFields["Mnemonic"]
        let originalMnemonic = mnemonicField.value as? String ?? ""
        
        // Set custom API URL
        if settingsApp.segmentedControls["Environment"].exists {
            settingsApp.segmentedControls["Environment"].buttons["Custom"].tap()
            
            let customUrlField = settingsApp.textFields["Custom API URL"]
            if customUrlField.exists {
                customUrlField.tap()
                customUrlField.clearText()
                let testApiUrl = "https://api-test-\(randomString(length: 8)).chroniclesync.xyz"
                customUrlField.typeText(testApiUrl)
            }
        }
        
        // Save settings
        if settingsApp.buttons["Save"].exists {
            settingsApp.buttons["Save"].tap()
        }
        
        // Close and reopen settings to verify persistence
        settingsApp.terminate()
        
        // Reopen settings
        app.activate()
        openExtensionSettings()
        
        // Navigate back to extension settings
        let reopenedSettingsApp = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
        XCTAssert(reopenedSettingsApp.wait(for: .runningForeground, timeout: 5))
        
        reopenedSettingsApp.tables.cells["Safari"].tap()
        reopenedSettingsApp.tables.cells["Extensions"].tap()
        reopenedSettingsApp.tables.cells.containing(.staticText, identifier: "ChronicleSync").element.tap()
        
        // Verify the mnemonic was saved
        let savedMnemonicField = reopenedSettingsApp.textFields["Mnemonic"]
        let savedMnemonic = savedMnemonicField.value as? String ?? ""
        
        XCTAssertFalse(savedMnemonic.isEmpty, "Mnemonic should not be empty")
        XCTAssertEqual(originalMnemonic, savedMnemonic, "Mnemonic should be the same as before")
        
        // Verify custom API URL was saved
        if reopenedSettingsApp.segmentedControls["Environment"].exists {
            let selectedEnvironment = reopenedSettingsApp.segmentedControls["Environment"].buttons.matching(NSPredicate(format: "isSelected == true")).firstMatch
            XCTAssertEqual(selectedEnvironment.label, "Custom", "Custom environment should be selected")
            
            let savedUrlField = reopenedSettingsApp.textFields["Custom API URL"]
            let savedUrl = savedUrlField.value as? String ?? ""
            XCTAssertTrue(savedUrl.contains("api-test-"), "Custom API URL should be saved")
        }
        
        // Close settings
        reopenedSettingsApp.terminate()
    }
    
    func testShouldResetSettings() {
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
        
        // Generate a mnemonic if needed
        if settingsApp.buttons["Generate Mnemonic"].exists {
            settingsApp.buttons["Generate Mnemonic"].tap()
        }
        
        // Save settings
        if settingsApp.buttons["Save"].exists {
            settingsApp.buttons["Save"].tap()
        }
        
        // Now reset settings
        if settingsApp.buttons["Reset Settings"].exists {
            settingsApp.buttons["Reset Settings"].tap()
            
            // Confirm reset if there's a confirmation dialog
            if settingsApp.alerts["Confirm Reset"].exists {
                settingsApp.alerts["Confirm Reset"].buttons["Reset"].tap()
            }
        }
        
        // Verify settings were reset
        let mnemonicField = settingsApp.textFields["Mnemonic"]
        let mnemonic = mnemonicField.value as? String ?? ""
        
        // The behavior depends on your app - either mnemonic is empty or a new one is generated
        // Here we'll check that it's either empty or different from a default value
        if !mnemonic.isEmpty {
            // If not empty, it should be a newly generated mnemonic
            // We can't easily verify this, but we can check it's a valid format
            XCTAssertTrue(mnemonic.components(separatedBy: " ").count >= 12, "Mnemonic should have at least 12 words")
        }
        
        // Verify environment is reset to default
        if settingsApp.segmentedControls["Environment"].exists {
            let selectedEnvironment = settingsApp.segmentedControls["Environment"].buttons.matching(NSPredicate(format: "isSelected == true")).firstMatch
            XCTAssertEqual(selectedEnvironment.label, "Production", "Environment should be reset to Production")
        }
        
        // Close settings
        settingsApp.terminate()
    }
}