import Foundation

class ChronicleSync {
    static let shared = ChronicleSync()
    
    private init() {}
    
    func initialize() {
        // Initialize the extension
        print("ChronicleSync Safari Extension initialized")
    }
}