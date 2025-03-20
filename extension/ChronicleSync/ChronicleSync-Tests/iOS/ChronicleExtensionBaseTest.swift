import XCTest
import SafariServices
import WebKit

class ChronicleExtensionBaseTest: XCTestCase {
    
    var app: XCUIApplication!
    var safari: XCUIApplication!
    let extensionBundleId = "xyz.chroniclesync.ChronicleSync.Extension"
    
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        
        // Initialize the main app
        app = XCUIApplication()
        app.launch()
        
        // Initialize Safari
        safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
    }
    
    override func tearDown() {
        app.terminate()
        safari.terminate()
        super.tearDown()
    }
    
    // Helper method to enable the Safari extension
    func enableSafariExtension() {
        // Open Settings app
        let settingsApp = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
        settingsApp.launch()
        
        // Navigate to Safari settings
        settingsApp.tables.cells["Safari"].tap()
        
        // Navigate to Extensions
        settingsApp.tables.cells["Extensions"].tap()
        
        // Find and enable our extension
        let extensionCell = settingsApp.tables.cells.containing(.staticText, identifier: "ChronicleSync").element
        extensionCell.tap()
        
        // Enable the extension if it's not already enabled
        let switchControl = extensionApp.switches.firstMatch
        if switchControl.value as? String == "0" {
            switchControl.tap()
        }
        
        // Go back to home screen
        settingsApp.terminate()
    }
    
    // Helper method to open Safari and navigate to a URL
    func openSafariAndNavigate(to urlString: String) {
        safari.launch()
        
        // Wait for Safari to fully launch
        XCTAssert(safari.wait(for: .runningForeground, timeout: 5))
        
        // Tap the address bar
        safari.textFields["Address"].tap()
        
        // Enter the URL
        safari.typeText(urlString)
        safari.keyboards.buttons["Go"].tap()
        
        // Wait for page to load
        sleep(2)
    }
    
    // Helper method to open extension settings
    func openExtensionSettings() {
        app.launch()
        
        // Tap the "Open Settings" button
        if app.buttons["Open Settings"].exists {
            app.buttons["Open Settings"].tap()
        }
        
        // Wait for settings to open
        sleep(1)
    }
    
    // Helper method to generate a random string
    func randomString(length: Int) -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<length).map{ _ in letters.randomElement()! })
    }
}