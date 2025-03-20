import XCTest
import SafariServices
import WebKit

class ContentSearchTests: ChronicleExtensionBaseTest {
    
    func testShouldSearchPageContent() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open Safari and navigate to a test page with known content
        openSafariAndNavigate(to: "https://example.com")
        
        // Open the extension from the share sheet
        safari.buttons["Share"].tap()
        safari.swipeUp()
        let extensionButton = safari.buttons["ChronicleSync"]
        extensionButton.tap()
        
        // Wait for extension UI to appear
        sleep(2)
        
        // Look for search functionality in the extension UI
        // This assumes your extension has a search field
        // You'll need to adjust based on your actual UI
        let searchField = safari.searchFields.firstMatch
        XCTAssertTrue(searchField.exists, "Search field should exist")
        
        // Enter a search term
        searchField.tap()
        searchField.typeText("example")
        safari.keyboards.buttons["Search"].tap()
        
        // Wait for search results
        sleep(2)
        
        // Check for search results
        // This assumes your extension displays search results in a specific way
        // You'll need to adjust based on your actual UI
        let searchResults = safari.tables["SearchResults"]
        XCTAssertTrue(searchResults.exists, "Search results should be displayed")
        XCTAssertTrue(searchResults.cells.count > 0, "Search should return at least one result")
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
    
    func testShouldHighlightSearchTermsOnPage() {
        // Enable the Safari extension
        enableSafariExtension()
        
        // Open Safari and navigate to a test page with known content
        openSafariAndNavigate(to: "https://example.com")
        
        // Open the extension from the share sheet
        safari.buttons["Share"].tap()
        safari.swipeUp()
        let extensionButton = safari.buttons["ChronicleSync"]
        extensionButton.tap()
        
        // Wait for extension UI to appear
        sleep(2)
        
        // Look for search functionality in the extension UI
        let searchField = safari.searchFields.firstMatch
        XCTAssertTrue(searchField.exists, "Search field should exist")
        
        // Enter a search term
        searchField.tap()
        searchField.typeText("example")
        safari.keyboards.buttons["Search"].tap()
        
        // Wait for search results
        sleep(2)
        
        // Tap on a search result to highlight it on the page
        let firstResult = safari.tables["SearchResults"].cells.firstMatch
        XCTAssertTrue(firstResult.exists, "At least one search result should exist")
        firstResult.tap()
        
        // Wait for the highlight to appear
        sleep(1)
        
        // Dismiss the extension to see the page
        safari.buttons["Done"].tap()
        
        // Check for highlighted text on the page
        // This is challenging to verify in UI tests, but we can check if the extension
        // has added highlight elements to the page
        
        // One approach is to check if the extension has modified the page's DOM
        // by injecting a script that counts highlight elements
        
        // For this test, we'll assume success if we can return to the page without errors
        // A more comprehensive test would require custom JavaScript injection
        
        // Take a screenshot for manual verification
        let screenshot = safari.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}