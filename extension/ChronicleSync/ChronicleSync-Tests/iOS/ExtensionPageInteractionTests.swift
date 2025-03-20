import XCTest
import SafariServices
import WebKit

class ExtensionPageInteractionTests: ChronicleExtensionBaseTest {
    
    func testShouldInteractWithWebPage() {
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
        
        // Look for page interaction features in the extension UI
        // This assumes your extension has buttons to interact with the page
        // You'll need to adjust based on your actual UI
        
        // For example, if your extension has a "Highlight" button
        if safari.buttons["Highlight"].exists {
            safari.buttons["Highlight"].tap()
            
            // Wait for the highlight to be applied
            sleep(1)
            
            // Dismiss the extension to see the page
            safari.buttons["Done"].tap()
            
            // Take a screenshot for manual verification
            let screenshot = safari.screenshot()
            let attachment = XCTAttachment(screenshot: screenshot)
            attachment.lifetime = .keepAlways
            add(attachment)
        } else {
            // If no highlight button, just dismiss the extension
            safari.buttons["Done"].tap()
        }
    }
    
    func testShouldSavePageForLater() {
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
        
        // Look for "Save for Later" feature in the extension UI
        // This assumes your extension has a save button
        // You'll need to adjust based on your actual UI
        if safari.buttons["Save for Later"].exists {
            safari.buttons["Save for Later"].tap()
            
            // Wait for confirmation
            sleep(1)
            
            // Check for confirmation message
            let confirmationMessage = safari.staticTexts.matching(NSPredicate(format: "label CONTAINS 'saved'")).firstMatch
            XCTAssertTrue(confirmationMessage.exists, "Confirmation message should be displayed")
            
            // Dismiss the extension
            safari.buttons["Done"].tap()
            
            // Now open the extension again and check saved pages
            safari.buttons["Share"].tap()
            safari.swipeUp()
            extensionButton.tap()
            
            // Wait for extension UI to appear
            sleep(2)
            
            // Navigate to saved pages
            if safari.buttons["Saved Pages"].exists {
                safari.buttons["Saved Pages"].tap()
                
                // Check for the saved page
                let savedPagesTable = safari.tables["SavedPagesTable"]
                XCTAssertTrue(savedPagesTable.exists, "Saved pages table should exist")
                
                let exampleItem = savedPagesTable.cells.containing(.staticText, identifier: "example.com").firstMatch
                XCTAssertTrue(exampleItem.exists, "Saved pages should contain example.com")
            }
        }
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
    
    func testShouldAnnotatePage() {
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
        
        // Look for annotation features in the extension UI
        // This assumes your extension has annotation buttons
        // You'll need to adjust based on your actual UI
        if safari.buttons["Annotate"].exists {
            safari.buttons["Annotate"].tap()
            
            // Wait for annotation UI
            sleep(1)
            
            // Add a note
            let noteField = safari.textFields["Note"]
            if noteField.exists {
                noteField.tap()
                noteField.typeText("This is a test annotation")
                
                // Save the annotation
                safari.buttons["Save Annotation"].tap()
                
                // Wait for confirmation
                sleep(1)
                
                // Check for confirmation message
                let confirmationMessage = safari.staticTexts.matching(NSPredicate(format: "label CONTAINS 'saved'")).firstMatch
                XCTAssertTrue(confirmationMessage.exists, "Confirmation message should be displayed")
            }
        }
        
        // Dismiss the extension
        safari.buttons["Done"].tap()
    }
}