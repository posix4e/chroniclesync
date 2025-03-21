import XCTest

class SettingsTests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        
        // Launch the app
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app.terminate()
    }
    
    // MARK: - Tests
    
    func testSettingsPageNavigation() throws {
        // Navigate to settings
        app.buttons["Settings"].tap()
        
        // Verify settings page loads
        XCTAssertTrue(app.staticTexts["ChronicleSync Settings"].waitForExistence(timeout: TestConfig.testTimeout))
    }
    
    func testMnemonicGeneration() throws {
        // Navigate to settings
        app.buttons["Settings"].tap()
        
        // Verify settings page loads
        XCTAssertTrue(app.staticTexts["ChronicleSync Settings"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Get current mnemonic and client ID
        let mnemonicField = app.textFields["mnemonic"]
        let clientIdField = app.textFields["clientId"]
        
        XCTAssertTrue(mnemonicField.waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(clientIdField.waitForExistence(timeout: TestConfig.testTimeout))
        
        let originalMnemonic = mnemonicField.value as? String
        let originalClientId = clientIdField.value as? String
        
        // Generate new mnemonic
        XCTAssertTrue(TestHelpers.tapElement(app.buttons["generateMnemonic"]))
        wait(for: TestConfig.shortWaitTime)
        
        // Verify new mnemonic and client ID are generated
        let newMnemonic = mnemonicField.value as? String
        let newClientId = clientIdField.value as? String
        
        XCTAssertNotEqual(originalMnemonic, newMnemonic, "Mnemonic should change after generation")
        XCTAssertNotEqual(originalClientId, newClientId, "Client ID should change after mnemonic generation")
    }
    
    func testSettingsSaving() throws {
        // Navigate to settings
        app.buttons["Settings"].tap()
        
        // Verify settings page loads
        XCTAssertTrue(app.staticTexts["ChronicleSync Settings"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Generate new mnemonic
        XCTAssertTrue(TestHelpers.tapElement(app.buttons["generateMnemonic"]))
        wait(for: TestConfig.shortWaitTime)
        
        // Get generated mnemonic and client ID
        let mnemonicField = app.textFields["mnemonic"]
        let clientIdField = app.textFields["clientId"]
        
        let mnemonic = mnemonicField.value as? String
        let clientId = clientIdField.value as? String
        
        XCTAssertFalse(mnemonic?.isEmpty ?? true, "Mnemonic should not be empty")
        XCTAssertFalse(clientId?.isEmpty ?? true, "Client ID should not be empty")
        
        // Save settings
        XCTAssertTrue(TestHelpers.tapElement(app.buttons["saveSettings"]))
        
        // Verify settings are saved
        XCTAssertTrue(app.staticTexts["Settings saved successfully"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Navigate away and back to settings to verify persistence
        app.navigationBars.buttons.firstMatch.tap()
        wait(for: TestConfig.shortWaitTime)
        app.buttons["Settings"].tap()
        
        // Verify settings are persisted
        let persistedMnemonicField = app.textFields["mnemonic"]
        let persistedClientIdField = app.textFields["clientId"]
        
        XCTAssertTrue(persistedMnemonicField.waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(persistedClientIdField.waitForExistence(timeout: TestConfig.testTimeout))
        
        let persistedMnemonic = persistedMnemonicField.value as? String
        let persistedClientId = persistedClientIdField.value as? String
        
        XCTAssertEqual(mnemonic, persistedMnemonic, "Mnemonic should persist after saving")
        XCTAssertEqual(clientId, persistedClientId, "Client ID should persist after saving")
    }
    
    func testAPIEndpointConfiguration() throws {
        // Navigate to settings
        app.buttons["Settings"].tap()
        
        // Verify settings page loads
        XCTAssertTrue(app.staticTexts["ChronicleSync Settings"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Check for API endpoint field
        let apiEndpointField = app.textFields["apiEndpoint"]
        XCTAssertTrue(apiEndpointField.waitForExistence(timeout: TestConfig.testTimeout))
        
        // Set custom API endpoint
        let customEndpoint = "https://custom-api.example.com"
        TestHelpers.clearAndEnterText(apiEndpointField, text: customEndpoint)
        
        // Save settings
        XCTAssertTrue(TestHelpers.tapElement(app.buttons["saveSettings"]))
        
        // Verify settings are saved
        XCTAssertTrue(app.staticTexts["Settings saved successfully"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Navigate away and back to settings to verify persistence
        app.navigationBars.buttons.firstMatch.tap()
        wait(for: TestConfig.shortWaitTime)
        app.buttons["Settings"].tap()
        
        // Verify API endpoint is persisted
        let persistedApiEndpointField = app.textFields["apiEndpoint"]
        XCTAssertTrue(persistedApiEndpointField.waitForExistence(timeout: TestConfig.testTimeout))
        
        let persistedApiEndpoint = persistedApiEndpointField.value as? String
        XCTAssertEqual(customEndpoint, persistedApiEndpoint, "API endpoint should persist after saving")
    }
    
    func testSyncToggle() throws {
        // Navigate to settings
        app.buttons["Settings"].tap()
        
        // Verify settings page loads
        XCTAssertTrue(app.staticTexts["ChronicleSync Settings"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Check for sync toggle
        let syncToggle = app.switches["enableSync"]
        XCTAssertTrue(syncToggle.waitForExistence(timeout: TestConfig.testTimeout))
        
        // Get initial state
        let initialState = syncToggle.value as? String
        
        // Toggle sync
        syncToggle.tap()
        
        // Verify toggle changed
        let newState = syncToggle.value as? String
        XCTAssertNotEqual(initialState, newState, "Sync toggle should change state")
        
        // Save settings
        XCTAssertTrue(TestHelpers.tapElement(app.buttons["saveSettings"]))
        
        // Verify settings are saved
        XCTAssertTrue(app.staticTexts["Settings saved successfully"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Navigate away and back to settings to verify persistence
        app.navigationBars.buttons.firstMatch.tap()
        wait(for: TestConfig.shortWaitTime)
        app.buttons["Settings"].tap()
        
        // Verify sync toggle state is persisted
        let persistedSyncToggle = app.switches["enableSync"]
        XCTAssertTrue(persistedSyncToggle.waitForExistence(timeout: TestConfig.testTimeout))
        
        let persistedState = persistedSyncToggle.value as? String
        XCTAssertEqual(newState, persistedState, "Sync toggle state should persist after saving")
    }
}