import XCTest
import SafariServices
import WebKit

class HistoryViewTests: ChronicleExtensionBaseTest {
    
    func testShouldDisplayBrowsingHistory() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open Safari and navigate to multiple test pages to generate history
        openSafariAndNavigate(to: "https://example.com")
        sleep(1)
        
        // Open a new tab
        safari.buttons["New Tab"].tap()
        openSafariAndNavigate(to: "https://mozilla.org")
        sleep(1)
        
        // Open another new tab
        safari.buttons["New Tab"].tap()
        openSafariAndNavigate(to: "https://github.com")
        sleep(1)
        
        // Wait for sync to occur
        sleep(3)
        
        // Open the extension from the share sheet
        safari.buttons["Share"].tap()
        safari.swipeUp()
        let extensionButton = safari.buttons["ChronicleSync"]
        extensionButton.tap()
        
        // Wait for extension UI to appear
        sleep(2)
        
        // Look for history view in the extension UI
        // This assumes your extension has a history tab or button
        // You'll need to adjust based on your actual UI
        if safari.buttons["History"].exists {
            safari.buttons["History"].tap()
        }
        
        // Check for history items
        // This assumes your extension displays history items in a table
        // You'll need to adjust based on your actual UI
        let historyTable = safari.tables["HistoryTable"]
        XCTAssertTrue(historyTable.exists, "History table should exist")
        
        // Verify we have at least the 3 history items we just created
        XCTAssertTrue(historyTable.cells.count >= 3, "History should contain at least 3 items")
        
        // Check for specific history items
        let exampleItem = historyTable.cells.containing(.staticText, identifier: "example.com").firstMatch
        let mozillaItem = historyTable.cells.containing(.staticText, identifier: "mozilla.org").firstMatch
        let githubItem = historyTable.cells.containing(.staticText, identifier: "github.com").firstMatch
        
        XCTAssertTrue(exampleItem.exists, "History should contain example.com")
        XCTAssertTrue(mozillaItem.exists, "History should contain mozilla.org")
        XCTAssertTrue(githubItem.exists, "History should contain github.com")
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
    
    func testShouldFilterHistoryByDate() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open Safari and navigate to multiple test pages to generate history
        openSafariAndNavigate(to: "https://example.com")
        sleep(1)
        
        // Open a new tab
        safari.buttons["New Tab"].tap()
        openSafariAndNavigate(to: "https://mozilla.org")
        sleep(1)
        
        // Wait for sync to occur
        sleep(3)
        
        // Open the extension from the share sheet
        safari.buttons["Share"].tap()
        safari.swipeUp()
        let extensionButton = safari.buttons["ChronicleSync"]
        extensionButton.tap()
        
        // Wait for extension UI to appear
        sleep(2)
        
        // Look for history view in the extension UI
        if safari.buttons["History"].exists {
            safari.buttons["History"].tap()
        }
        
        // Look for date filter controls
        // This assumes your extension has date filter controls
        // You'll need to adjust based on your actual UI
        if safari.buttons["Filter"].exists {
            safari.buttons["Filter"].tap()
            
            // Select "Today" filter
            safari.buttons["Today"].tap()
            
            // Check that history items are filtered
            let historyTable = safari.tables["HistoryTable"]
            XCTAssertTrue(historyTable.exists, "History table should exist")
            
            // Our test items should be visible since we just created them
            let exampleItem = historyTable.cells.containing(.staticText, identifier: "example.com").firstMatch
            let mozillaItem = historyTable.cells.containing(.staticText, identifier: "mozilla.org").firstMatch
            
            XCTAssertTrue(exampleItem.exists, "History should contain example.com")
            XCTAssertTrue(mozillaItem.exists, "History should contain mozilla.org")
            
            // Now select "Yesterday" filter
            safari.buttons["Yesterday"].tap()
            
            // Our test items should not be visible since they were created today
            let yesterdayExampleItem = historyTable.cells.containing(.staticText, identifier: "example.com").firstMatch
            let yesterdayMozillaItem = historyTable.cells.containing(.staticText, identifier: "mozilla.org").firstMatch
            
            XCTAssertFalse(yesterdayExampleItem.exists, "Today's history should not appear in yesterday's filter")
            XCTAssertFalse(yesterdayMozillaItem.exists, "Today's history should not appear in yesterday's filter")
        }
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
    
    func testShouldSearchHistory() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open Safari and navigate to multiple test pages to generate history
        openSafariAndNavigate(to: "https://example.com")
        sleep(1)
        
        // Open a new tab
        safari.buttons["New Tab"].tap()
        openSafariAndNavigate(to: "https://mozilla.org")
        sleep(1)
        
        // Open another new tab
        safari.buttons["New Tab"].tap()
        openSafariAndNavigate(to: "https://github.com")
        sleep(1)
        
        // Wait for sync to occur
        sleep(3)
        
        // Open the extension from the share sheet
        safari.buttons["Share"].tap()
        safari.swipeUp()
        let extensionButton = safari.buttons["ChronicleSync"]
        extensionButton.tap()
        
        // Wait for extension UI to appear
        sleep(2)
        
        // Look for history view in the extension UI
        if safari.buttons["History"].exists {
            safari.buttons["History"].tap()
        }
        
        // Look for search functionality
        let searchField = safari.searchFields.firstMatch
        XCTAssertTrue(searchField.exists, "Search field should exist")
        
        // Search for "example"
        searchField.tap()
        searchField.typeText("example")
        safari.keyboards.buttons["Search"].tap()
        
        // Wait for search results
        sleep(1)
        
        // Check that only example.com is shown
        let historyTable = safari.tables["HistoryTable"]
        XCTAssertTrue(historyTable.exists, "History table should exist")
        
        let exampleItem = historyTable.cells.containing(.staticText, identifier: "example.com").firstMatch
        let mozillaItem = historyTable.cells.containing(.staticText, identifier: "mozilla.org").firstMatch
        let githubItem = historyTable.cells.containing(.staticText, identifier: "github.com").firstMatch
        
        XCTAssertTrue(exampleItem.exists, "Search results should contain example.com")
        XCTAssertFalse(mozillaItem.exists, "Search results should not contain mozilla.org")
        XCTAssertFalse(githubItem.exists, "Search results should not contain github.com")
        
        // Clear search and verify all items are shown again
        searchField.tap()
        searchField.buttons["Clear text"].tap()
        safari.keyboards.buttons["Search"].tap()
        
        // Wait for results to update
        sleep(1)
        
        // All items should be visible again
        let allExampleItem = historyTable.cells.containing(.staticText, identifier: "example.com").firstMatch
        let allMozillaItem = historyTable.cells.containing(.staticText, identifier: "mozilla.org").firstMatch
        let allGithubItem = historyTable.cells.containing(.staticText, identifier: "github.com").firstMatch
        
        XCTAssertTrue(allExampleItem.exists, "History should contain example.com")
        XCTAssertTrue(allMozillaItem.exists, "History should contain mozilla.org")
        XCTAssertTrue(allGithubItem.exists, "History should contain github.com")
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
}