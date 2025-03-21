import XCTest

class ExtensionTests: XCTestCase {
    
    var app: XCUIApplication!
    var safari: XCUIApplication!
    var clientId: String?
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        
        // Launch the app
        app = XCUIApplication()
        app.launch()
        
        // Enable the Safari extension if needed
        TestHelpers.enableSafariExtension(app: app)
        
        // Get or generate client ID from settings
        clientId = try getOrGenerateClientId()
    }
    
    override func tearDownWithError() throws {
        // Close Safari if it's running
        if safari != nil {
            safari.terminate()
        }
        
        // Close the app
        app.terminate()
    }
    
    // MARK: - Helper Methods
    
    private func getOrGenerateClientId() throws -> String {
        // Navigate to settings
        app.buttons["Settings"].tap()
        
        // Wait for settings to load
        XCTAssertTrue(app.staticTexts["ChronicleSync Settings"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Check if mnemonic and client ID exist
        let mnemonicField = app.textFields["mnemonic"]
        let clientIdField = app.textFields["clientId"]
        
        XCTAssertTrue(mnemonicField.waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(clientIdField.waitForExistence(timeout: TestConfig.testTimeout))
        
        // If client ID is empty, generate a new one
        if (clientIdField.value as? String)?.isEmpty ?? true {
            XCTAssertTrue(TestHelpers.tapElement(app.buttons["generateMnemonic"]))
            wait(for: TestConfig.shortWaitTime)
        }
        
        // Get the client ID
        guard let clientId = clientIdField.value as? String, !clientId.isEmpty else {
            throw XCTError(.failureWhileWaiting, "Failed to get or generate client ID")
        }
        
        // Save settings
        XCTAssertTrue(TestHelpers.tapElement(app.buttons["saveSettings"]))
        wait(for: TestConfig.shortWaitTime)
        
        // Go back to main screen
        app.navigationBars.buttons.firstMatch.tap()
        
        return clientId
    }
    
    // MARK: - Tests
    
    func testExtensionLoading() throws {
        // Open Safari with example.com
        safari = TestHelpers.openSafari(app: app, url: TestConfig.exampleUrl)
        
        // Wait for page to load
        XCTAssertTrue(safari.staticTexts["Example Domain"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Activate the extension
        TestHelpers.activateExtension(in: safari)
        
        // Verify extension popup appears
        XCTAssertTrue(safari.staticTexts["ChronicleSync"].waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(safari.staticTexts["Admin Login"].waitForExistence(timeout: TestConfig.testTimeout))
    }
    
    func testAPIHealthCheck() throws {
        guard let clientId = self.clientId else {
            XCTFail("Client ID not available")
            return
        }
        
        // Perform health check
        let expectation = self.expectation(description: "API Health Check")
        
        Task {
            do {
                let (data, response) = try await TestHelpers.performHealthCheck(clientId: clientId)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    XCTFail("Response is not HTTPURLResponse")
                    return
                }
                
                XCTAssertEqual(httpResponse.statusCode, 200, "Health check failed with status code \(httpResponse.statusCode)")
                
                // Parse response
                let jsonResponse = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                XCTAssertNotNil(jsonResponse, "Failed to parse JSON response")
                XCTAssertEqual(jsonResponse?["healthy"] as? Bool, true, "API is not healthy")
                
                expectation.fulfill()
            } catch {
                XCTFail("Health check failed with error: \(error)")
                expectation.fulfill()
            }
        }
        
        wait(for: [expectation], timeout: TestConfig.testTimeout)
    }
    
    func testPopupUI() throws {
        // Open Safari with example.com
        safari = TestHelpers.openSafari(app: app, url: TestConfig.exampleUrl)
        
        // Wait for page to load
        XCTAssertTrue(safari.staticTexts["Example Domain"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Activate the extension
        TestHelpers.activateExtension(in: safari)
        
        // Verify extension popup appears with correct UI elements
        XCTAssertTrue(safari.staticTexts["ChronicleSync"].waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(safari.staticTexts["Admin Login"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Check for login form elements
        XCTAssertTrue(safari.textFields["Username"].waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(safari.secureTextFields["Password"].waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(safari.buttons["Login"].waitForExistence(timeout: TestConfig.testTimeout))
    }
    
    func testContentSearch() throws {
        // Open Safari with example.com
        safari = TestHelpers.openSafari(app: app, url: TestConfig.exampleUrl)
        
        // Wait for page to load
        XCTAssertTrue(safari.staticTexts["Example Domain"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Activate the extension
        TestHelpers.activateExtension(in: safari)
        
        // Verify extension popup appears
        XCTAssertTrue(safari.staticTexts["ChronicleSync"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Navigate to search tab if available
        if safari.buttons["Search"].exists {
            safari.buttons["Search"].tap()
        }
        
        // Check for search input
        XCTAssertTrue(safari.textFields["searchInput"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Perform a search
        TestHelpers.enterText(safari.textFields["searchInput"], text: "example")
        safari.buttons["searchButton"].tap()
        
        // Wait for search results
        wait(for: TestConfig.mediumWaitTime)
        
        // Verify search results appear
        XCTAssertTrue(safari.staticTexts["Search Results"].waitForExistence(timeout: TestConfig.testTimeout))
    }
    
    func testHistorySync() throws {
        guard let clientId = self.clientId else {
            XCTFail("Client ID not available")
            return
        }
        
        // Open Safari with example.com
        safari = TestHelpers.openSafari(app: app, url: TestConfig.exampleUrl)
        
        // Wait for page to load
        XCTAssertTrue(safari.staticTexts["Example Domain"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Wait for history to sync
        wait(for: TestConfig.longWaitTime)
        
        // Open the extension popup
        TestHelpers.activateExtension(in: safari)
        
        // Navigate to history tab if available
        if safari.buttons["History"].exists {
            safari.buttons["History"].tap()
        }
        
        // Verify history entry exists
        XCTAssertTrue(safari.staticTexts["example.com"].waitForExistence(timeout: TestConfig.testTimeout))
    }
    
    func testSettingsPage() throws {
        // Navigate to settings in the app
        app.buttons["Settings"].tap()
        
        // Verify settings page elements
        XCTAssertTrue(app.staticTexts["ChronicleSync Settings"].waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(app.textFields["mnemonic"].waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(app.textFields["clientId"].waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(app.buttons["generateMnemonic"].waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(app.buttons["saveSettings"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Test generating a new mnemonic
        TestHelpers.tapElement(app.buttons["generateMnemonic"])
        wait(for: TestConfig.shortWaitTime)
        
        // Verify mnemonic and client ID are generated
        XCTAssertFalse((app.textFields["mnemonic"].value as? String)?.isEmpty ?? true)
        XCTAssertFalse((app.textFields["clientId"].value as? String)?.isEmpty ?? true)
        
        // Save settings
        TestHelpers.tapElement(app.buttons["saveSettings"])
        
        // Verify settings are saved
        XCTAssertTrue(app.staticTexts["Settings saved successfully"].waitForExistence(timeout: TestConfig.testTimeout))
    }
}