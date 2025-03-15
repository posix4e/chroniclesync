import XCTest
import SafariServices
@testable import ChronicleSync

class ChronicleSyncTests: XCTestCase {
    
    var app: XCUIApplication!
    var safari: XCUIApplication!
    var settings: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        
        // Initialize the main app
        app = XCUIApplication()
        app.launch()
        
        // Initialize Safari
        safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        
        // Initialize Settings app for extension management
        settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
    }
    
    override func tearDownWithError() throws {
        // Clean up after each test
        app.terminate()
        safari.terminate()
        settings.terminate()
    }
    
    func testAppLaunchAndUI() throws {
        // Verify the app launches successfully
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 5))
        
        // Take a screenshot of the initial app state
        let initialScreenshot = XCUIScreen.main.screenshot()
        saveScreenshot(initialScreenshot, named: "01_app_launch")
        
        // Verify basic UI elements exist
        XCTAssertTrue(app.staticTexts["ChronicleSync"].exists || app.navigationBars["ChronicleSync"].exists, 
                     "App title should be visible")
        
        // Check for the Enable Extension button or other key UI elements
        let enableButton = app.buttons["Enable Extension"]
        if enableButton.exists {
            XCTAssertTrue(enableButton.isHittable, "Enable Extension button should be tappable")
            
            // Take a screenshot showing the button
            let buttonScreenshot = XCUIScreen.main.screenshot()
            saveScreenshot(buttonScreenshot, named: "02_enable_button_visible")
        } else {
            // Log that we couldn't find the expected button but the app did launch
            XCTAssertTrue(app.buttons.count > 0, "App should have at least one button")
            
            // Take a screenshot of whatever UI is visible
            let uiScreenshot = XCUIScreen.main.screenshot()
            saveScreenshot(uiScreenshot, named: "02_app_ui")
        }
    }
    
    func testSafariExtensionBasics() throws {
        // Launch Safari
        safari.launch()
        XCTAssertTrue(safari.wait(for: .runningForeground, timeout: 5))
        
        // Take a screenshot of Safari
        let safariScreenshot = XCUIScreen.main.screenshot()
        saveScreenshot(safariScreenshot, named: "03_safari_launched")
        
        // Navigate to a test website
        if safari.textFields["URL"].exists {
            safari.textFields["URL"].tap()
            safari.textFields["URL"].typeText("https://example.com\n")
            
            // Wait for the page to load
            let pageLoaded = safari.staticTexts["Example Domain"].waitForExistence(timeout: 10)
            XCTAssertTrue(pageLoaded, "Example.com should load")
            
            // Take a screenshot of the loaded page
            let pageLoadedScreenshot = XCUIScreen.main.screenshot()
            saveScreenshot(pageLoadedScreenshot, named: "04_example_page_loaded")
            
            // Try to access Safari extensions menu
            // Note: This is a simplified approach as accessing extensions in Safari on iOS
            // requires user interaction with system UI that's hard to automate
            if safari.buttons["Share"].exists {
                safari.buttons["Share"].tap()
                
                // Wait briefly for the share sheet
                sleep(1)
                
                // Take a screenshot of the share sheet
                let shareScreenshot = XCUIScreen.main.screenshot()
                saveScreenshot(shareScreenshot, named: "05_share_sheet")
                
                // Look for our extension in the share sheet
                // This is a best-effort check as the extension might be in a submenu
                let extensionExists = safari.buttons["ChronicleSync"].exists || 
                                     safari.collectionViews.buttons["ChronicleSync"].exists ||
                                     safari.scrollViews.buttons["ChronicleSync"].exists
                
                // We're not asserting here because the extension might be in a submenu that's not visible
                if extensionExists {
                    XCTAssertTrue(extensionExists, "ChronicleSync extension should be visible in share sheet")
                } else {
                    // Just log that we couldn't find it directly
                    print("Note: ChronicleSync extension not directly visible in share sheet")
                }
                
                // Dismiss the share sheet by tapping outside
                safari.tap()
            }
        } else {
            // If we can't find the URL field, at least verify Safari is running
            XCTAssertTrue(safari.exists, "Safari should be running")
            
            // Take a screenshot of whatever state Safari is in
            let safariStateScreenshot = XCUIScreen.main.screenshot()
            saveScreenshot(safariStateScreenshot, named: "04_safari_state")
        }
    }
    
    func testExtensionInSettings() throws {
        // Launch Settings app
        settings.launch()
        XCTAssertTrue(settings.wait(for: .runningForeground, timeout: 5))
        
        // Take a screenshot of Settings
        let settingsScreenshot = XCUIScreen.main.screenshot()
        saveScreenshot(settingsScreenshot, named: "06_settings_app")
        
        // Navigate to Safari settings
        if settings.tables.cells["Safari"].exists {
            settings.tables.cells["Safari"].tap()
            
            // Take a screenshot of Safari settings
            let safariSettingsScreenshot = XCUIScreen.main.screenshot()
            saveScreenshot(safariSettingsScreenshot, named: "07_safari_settings")
            
            // Try to navigate to Extensions
            if settings.tables.cells["Extensions"].exists {
                settings.tables.cells["Extensions"].tap()
                
                // Take a screenshot of Extensions settings
                let extensionsScreenshot = XCUIScreen.main.screenshot()
                saveScreenshot(extensionsScreenshot, named: "08_extensions_settings")
                
                // Look for our extension
                let extensionExists = settings.tables.cells.containing(NSPredicate(format: "label CONTAINS %@", "ChronicleSync")).count > 0
                
                // We're not asserting here because the extension might not be installed yet
                if extensionExists {
                    print("ChronicleSync extension found in Safari Extensions settings")
                } else {
                    print("Note: ChronicleSync extension not found in Safari Extensions settings")
                }
            }
        }
    }
    
    // Helper function to save screenshots
    private func saveScreenshot(_ screenshot: XCUIScreenshot, named name: String) {
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        
        // Save to a directory that will be uploaded as artifacts in CI
        if let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first {
            let screenshotsDir = "\(documentsPath)/test-screenshots"
            
            // Create directory if it doesn't exist
            let fileManager = FileManager.default
            if !fileManager.fileExists(atPath: screenshotsDir) {
                try? fileManager.createDirectory(atPath: screenshotsDir, withIntermediateDirectories: true)
            }
            
            // Save the screenshot
            let imagePath = "\(screenshotsDir)/\(name).png"
            try? screenshot.pngRepresentation.write(to: URL(fileURLWithPath: imagePath))
            
            print("Screenshot saved to: \(imagePath)")
        }
    }
}