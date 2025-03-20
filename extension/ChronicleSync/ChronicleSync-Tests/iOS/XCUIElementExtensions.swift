import XCTest

extension XCUIElement {
    
    // Clear text in a text field
    func clearText() {
        guard let stringValue = self.value as? String else {
            return
        }
        
        // Select all and delete
        self.tap()
        let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: stringValue.count)
        self.typeText(deleteString)
    }
    
    // Wait for element to exist with timeout
    func waitForExistence(timeout: TimeInterval = 5) -> Bool {
        return self.waitForExistence(timeout: timeout)
    }
    
    // Tap element if it exists
    @discardableResult
    func tapIfExists() -> Bool {
        if self.exists {
            self.tap()
            return true
        }
        return false
    }
    
    // Scroll until element is visible
    func scrollToVisible() {
        if !self.isVisible {
            let startPoint = CGVector(dx: 0.5, dy: 0.5)
            let endPoint = CGVector(dx: 0.5, dy: 0.2)
            
            while !self.isVisible {
                let parentScroll = self.firstAncestor(where: { $0.elementType == .scrollView || $0.elementType == .table || $0.elementType == .collectionView })
                parentScroll?.swipe(from: startPoint, to: endPoint)
                
                // Break if we've scrolled too much without finding the element
                if !self.exists {
                    break
                }
            }
        }
    }
    
    // Check if element is visible on screen
    var isVisible: Bool {
        guard self.exists else { return false }
        return XCUIApplication().windows.element(boundBy: 0).frame.contains(self.frame)
    }
}