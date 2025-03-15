//
//  SyncService.swift
//  ChronicleSync
//
//  Created by OpenHands AI on 3/15/25.
//

import Foundation
import Combine

class SyncService {
    static let shared = SyncService()
    
    private let apiEndpoint = "https://api.chroniclesync.xyz"
    private let userDefaults = UserDefaults.standard
    private let syncQueueKey = "syncQueue"
    private let lastSyncKey = "lastSync"
    
    private init() {}
    
    func saveHistory(_ historyItem: HistoryItemModel) -> AnyPublisher<Bool, Error> {
        // First save locally
        return saveLocally(historyItem)
            .flatMap { [weak self] success -> AnyPublisher<Bool, Error> in
                guard let self = self else {
                    return Fail(error: NSError(domain: "SyncService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Self is nil"]))
                        .eraseToAnyPublisher()
                }
                
                // If online, try to sync with server
                if NetworkMonitor.shared.isConnected {
                    return self.syncWithServer(historyItem)
                } else {
                    // Add to sync queue for later
                    self.addToSyncQueue(historyItem)
                    return Just(true)
                        .setFailureType(to: Error.self)
                        .eraseToAnyPublisher()
                }
            }
            .eraseToAnyPublisher()
    }
    
    func syncNow() -> AnyPublisher<Bool, Error> {
        guard NetworkMonitor.shared.isConnected else {
            return Fail(error: NSError(domain: "SyncService", code: -1, userInfo: [NSLocalizedDescriptionKey: "No internet connection"]))
                .eraseToAnyPublisher()
        }
        
        return processSyncQueue()
            .map { _ in true }
            .eraseToAnyPublisher()
    }
    
    private func saveLocally(_ historyItem: HistoryItemModel) -> AnyPublisher<Bool, Error> {
        return Future<Bool, Error> { [weak self] promise in
            guard let self = self else {
                promise(.failure(NSError(domain: "SyncService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Self is nil"])))
                return
            }
            
            do {
                // Get existing history items
                var histories = self.userDefaults.dictionary(forKey: "syncHistories") as? [String: Any] ?? [:]
                
                // Add new history item
                histories[historyItem.id] = historyItem.toJavaScript()
                
                // Save back to UserDefaults
                self.userDefaults.set(histories, forKey: "syncHistories")
                
                promise(.success(true))
            } catch {
                promise(.failure(error))
            }
        }
        .eraseToAnyPublisher()
    }
    
    private func syncWithServer(_ historyItem: HistoryItemModel) -> AnyPublisher<Bool, Error> {
        guard let url = URL(string: "\(apiEndpoint)/api/history") else {
            return Fail(error: NSError(domain: "SyncService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: historyItem.toJavaScript(), options: [])
            request.httpBody = jsonData
        } catch {
            return Fail(error: error)
                .eraseToAnyPublisher()
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response -> Bool in
                guard let httpResponse = response as? HTTPURLResponse,
                      (200...299).contains(httpResponse.statusCode) else {
                    throw NSError(domain: "SyncService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Server error"])
                }
                
                // Update last sync time
                UserDefaults.standard.set(Date(), forKey: self.lastSyncKey)
                
                return true
            }
            .mapError { $0 as Error }
            .eraseToAnyPublisher()
    }
    
    private func addToSyncQueue(_ historyItem: HistoryItemModel) {
        var queue = userDefaults.array(forKey: syncQueueKey) as? [[String: Any]] ?? []
        queue.append([
            "data": historyItem.toJavaScript(),
            "timestamp": Date().timeIntervalSince1970
        ])
        userDefaults.set(queue, forKey: syncQueueKey)
    }
    
    private func processSyncQueue() -> AnyPublisher<Int, Error> {
        guard let queue = userDefaults.array(forKey: syncQueueKey) as? [[String: Any]], !queue.isEmpty else {
            return Just(0)
                .setFailureType(to: Error.self)
                .eraseToAnyPublisher()
        }
        
        let publishers = queue.enumerated().compactMap { index, item -> AnyPublisher<Int, Error>? in
            guard let data = item["data"] as? [String: Any],
                  let historyItem = HistoryItemModel(fromJavaScript: data) else {
                return nil
            }
            
            return syncWithServer(historyItem)
                .map { _ in index }
                .eraseToAnyPublisher()
        }
        
        return Publishers.MergeMany(publishers)
            .collect()
            .map { successfulIndices -> Int in
                // Remove successful items from queue
                var newQueue = queue
                for index in successfulIndices.sorted(by: >) {
                    newQueue.remove(at: index)
                }
                self.userDefaults.set(newQueue, forKey: self.syncQueueKey)
                return successfulIndices.count
            }
            .eraseToAnyPublisher()
    }
}

// Simple network monitor class
class NetworkMonitor {
    static let shared = NetworkMonitor()
    
    var isConnected: Bool = true
    
    private init() {
        // In a real app, you would implement proper network monitoring
        // This is just a placeholder that always returns true
    }
}