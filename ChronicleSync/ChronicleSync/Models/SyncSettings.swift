import Foundation
import Combine

class SyncSettings: ObservableObject {
    @Published var syncEnabled: Bool = UserDefaults.standard.bool(forKey: "syncEnabled") {
        didSet {
            UserDefaults.standard.set(syncEnabled, forKey: "syncEnabled")
        }
    }
    
    @Published var isOnline: Bool = true
    @Published var lastSync: Date? = UserDefaults.standard.object(forKey: "lastSync") as? Date
    @Published var pendingItems: Int = 0
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Monitor network status
        NotificationCenter.default.publisher(for: .NSMetadataQueryDidFinishGathering)
            .sink { [weak self] _ in
                self?.updateNetworkStatus()
            }
            .store(in: &cancellables)
        
        // Initial network check
        updateNetworkStatus()
        
        // Load pending items count
        loadPendingItemsCount()
    }
    
    var lastSyncFormatted: String {
        guard let lastSync = lastSync else {
            return "Never"
        }
        
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: lastSync)
    }
    
    func syncNow() {
        // Implement sync logic here
        // This would communicate with the Safari extension
        
        // For demo purposes, just update the last sync time
        lastSync = Date()
        UserDefaults.standard.set(lastSync, forKey: "lastSync")
        
        // Simulate reducing pending items
        if pendingItems > 0 {
            pendingItems -= min(pendingItems, Int.random(in: 1...3))
        }
    }
    
    private func updateNetworkStatus() {
        // In a real app, you would implement proper network reachability
        // This is just a placeholder
        isOnline = true
    }
    
    private func loadPendingItemsCount() {
        // In a real app, you would get this from your sync service
        // This is just a placeholder
        pendingItems = Int.random(in: 0...10)
    }
}