import XCTest
@testable import ChronicleSync

class ContentViewTests: XCTestCase {
    
    var syncSettings: SyncSettings!
    
    override func setUp() {
        super.setUp()
        syncSettings = SyncSettings()
    }
    
    override func tearDown() {
        syncSettings = nil
        super.tearDown()
    }
    
    func testSyncSettingsInitialState() {
        // Test initial state of SyncSettings
        XCTAssertEqual(syncSettings.syncEnabled, UserDefaults.standard.bool(forKey: "syncEnabled"))
        XCTAssertTrue(syncSettings.isOnline) // Default is true in our mock implementation
        
        // Test lastSyncFormatted
        if let lastSync = syncSettings.lastSync {
            let formatter = DateFormatter()
            formatter.dateStyle = .short
            formatter.timeStyle = .short
            XCTAssertEqual(syncSettings.lastSyncFormatted, formatter.string(from: lastSync))
        } else {
            XCTAssertEqual(syncSettings.lastSyncFormatted, "Never")
        }
    }
    
    func testSyncNow() {
        // Record the last sync time before calling syncNow
        let lastSyncBefore = syncSettings.lastSync
        let pendingItemsBefore = syncSettings.pendingItems
        
        // Call syncNow
        syncSettings.syncNow()
        
        // Test that the last sync time was updated
        XCTAssertNotEqual(syncSettings.lastSync, lastSyncBefore)
        
        // Test that pendingItems was reduced if it was > 0
        if pendingItemsBefore > 0 {
            XCTAssertLessThanOrEqual(syncSettings.pendingItems, pendingItemsBefore)
        }
    }
}