import XCTest

class HistoryViewTests: XCTestCase {
    
    var app: XCUIApplication!
    var safari: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        
        // Launch the app
        app = XCUIApplication()
        app.launch()
        
        // Enable the Safari extension if needed
        TestHelpers.enableSafariExtension(app: app)
    }
    
    override func tearDownWithError() throws {
        // Close Safari if it's running
        if safari != nil {
            safari.terminate()
        }
        
        // Close the app
        app.terminate()
    }
    
    // MARK: - Tests
    
    func testHistoryViewLoading() throws {
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
        
        // Verify history view loads
        XCTAssertTrue(safari.staticTexts["Browsing History"].waitForExistence(timeout: TestConfig.testTimeout))
    }
    
    func testHistoryFiltering() throws {
        // Open Safari with example.com
        safari = TestHelpers.openSafari(app: app, url: TestConfig.exampleUrl)
        
        // Wait for page to load
        XCTAssertTrue(safari.staticTexts["Example Domain"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Wait for history to sync
        wait(for: TestConfig.longWaitTime)
        
        // Open another page
        safari.textFields["URL"].tap()
        safari.textFields["URL"].clearText()
        safari.textFields["URL"].typeText("https://apple.com")
        safari.keyboards.buttons["Go"].tap()
        
        // Wait for page to load and history to sync
        wait(for: TestConfig.longWaitTime)
        
        // Open the extension popup
        TestHelpers.activateExtension(in: safari)
        
        // Navigate to history tab if available
        if safari.buttons["History"].exists {
            safari.buttons["History"].tap()
        }
        
        // Verify history view loads with multiple entries
        XCTAssertTrue(safari.staticTexts["Browsing History"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Check for filter input
        XCTAssertTrue(safari.textFields["filterInput"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Filter history
        TestHelpers.enterText(safari.textFields["filterInput"], text: "example")
        
        // Verify filtered results
        XCTAssertTrue(safari.staticTexts["example.com"].waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertFalse(safari.staticTexts["apple.com"].exists)
        
        // Clear filter
        safari.textFields["filterInput"].clearText()
        
        // Verify all results are shown
        XCTAssertTrue(safari.staticTexts["example.com"].waitForExistence(timeout: TestConfig.testTimeout))
        XCTAssertTrue(safari.staticTexts["apple.com"].waitForExistence(timeout: TestConfig.testTimeout))
    }
    
    func testHistoryItemInteraction() throws {
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
        
        // Verify history view loads
        XCTAssertTrue(safari.staticTexts["Browsing History"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Find and tap on a history item
        let historyItem = safari.staticTexts["example.com"]
        XCTAssertTrue(historyItem.waitForExistence(timeout: TestConfig.testTimeout))
        historyItem.tap()
        
        // Verify navigation to the history item
        wait(for: TestConfig.mediumWaitTime)
        XCTAssertTrue(safari.staticTexts["Example Domain"].waitForExistence(timeout: TestConfig.testTimeout))
    }
    
    func testHistoryDeletion() throws {
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
        
        // Verify history view loads
        XCTAssertTrue(safari.staticTexts["Browsing History"].waitForExistence(timeout: TestConfig.testTimeout))
        
        // Find a history item
        let historyItem = safari.staticTexts["example.com"]
        XCTAssertTrue(historyItem.waitForExistence(timeout: TestConfig.testTimeout))
        
        // Delete the history item (using swipe to delete or delete button)
        let cell = historyItem.firstAncestor(matching: .cell)
        cell?.swipeLeft()
        
        // Tap delete button
        let deleteButton = safari.buttons["Delete"]
        XCTAssertTrue(deleteButton.waitForExistence(timeout: TestConfig.testTimeout))
        deleteButton.tap()
        
        // Verify item is deleted
        wait(for: TestConfig.shortWaitTime)
        XCTAssertFalse(safari.staticTexts["example.com"].exists)
    }
}