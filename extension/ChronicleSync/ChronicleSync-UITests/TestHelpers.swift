import XCTest
import WebKit

class TestHelpers {
    
    // MARK: - Network Helpers
    
    static func performHealthCheck(clientId: String) async throws -> (Data, URLResponse) {
        var request = URLRequest(url: URL(string: TestConfig.healthEndpoint)!)
        request.httpMethod = "GET"
        request.addValue(clientId, forHTTPHeaderField: "X-Client-Id")
        
        return try await URLSession.shared.data(for: request)
    }
    
    // MARK: - UI Helpers
    
    static func waitForElement(_ element: XCUIElement, timeout: TimeInterval = TestConfig.testTimeout) -> Bool {
        return element.waitForExistence(timeout: timeout)
    }
    
    static func tapElement(_ element: XCUIElement, timeout: TimeInterval = TestConfig.testTimeout) -> Bool {
        guard element.waitForExistence(timeout: timeout) else {
            return false
        }
        
        element.tap()
        return true
    }
    
    static func enterText(_ element: XCUIElement, text: String, timeout: TimeInterval = TestConfig.testTimeout) -> Bool {
        guard element.waitForExistence(timeout: timeout) else {
            return false
        }
        
        element.tap()
        element.typeText(text)
        return true
    }
    
    static func clearAndEnterText(_ element: XCUIElement, text: String, timeout: TimeInterval = TestConfig.testTimeout) -> Bool {
        guard element.waitForExistence(timeout: timeout) else {
            return false
        }
        
        element.tap()
        element.clearText()
        element.typeText(text)
        return true
    }
    
    // MARK: - Safari Extension Helpers
    
    static func enableSafariExtension(app: XCUIApplication) {
        // Navigate to Safari settings
        app.buttons["Settings"].tap()
        app.tables.cells["Safari"].tap()
        app.tables.cells["Extensions"].tap()
        
        // Enable the ChronicleSync extension
        let extensionSwitch = app.switches.firstMatch
        if extensionSwitch.value as? String == "0" {
            extensionSwitch.tap()
        }
        
        // Go back to the app
        app.navigationBars.buttons.firstMatch.tap()
        app.navigationBars.buttons.firstMatch.tap()
    }
    
    static func openSafari(app: XCUIApplication, url: String) -> XCUIApplication {
        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        safari.launch()
        
        // Type URL in Safari
        safari.textFields["URL"].tap()
        safari.textFields["URL"].typeText(url)
        safari.keyboards.buttons["Go"].tap()
        
        return safari
    }
    
    static func activateExtension(in safari: XCUIApplication) {
        // Tap on the share button
        safari.buttons["Share"].tap()
        
        // Scroll to find the extension
        let extensionButton = safari.buttons["ChronicleSync"]
        
        // Scroll if needed to find the extension
        let shareSheet = safari.otherElements["ActivityListView"]
        let startPoint = shareSheet.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        let endPoint = shareSheet.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.2))
        
        while !extensionButton.exists {
            startPoint.press(forDuration: 0.1, thenDragTo: endPoint)
        }
        
        extensionButton.tap()
    }
}

// MARK: - XCUIElement Extensions

extension XCUIElement {
    func clearText() {
        guard let stringValue = self.value as? String else {
            return
        }
        
        // Select all and delete
        self.tap()
        let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: stringValue.count)
        self.typeText(deleteString)
    }
}

// MARK: - XCTest Extensions

extension XCTestCase {
    func wait(for duration: TimeInterval) {
        let expectation = self.expectation(description: "Waiting for \(duration) seconds")
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
            expectation.fulfill()
        }
        self.wait(for: [expectation], timeout: duration + 1)
    }
}