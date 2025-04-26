import Foundation
import SafariServices
import WebKit
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    private let logger = Logger(subsystem: "dev.all-hands.ChronicleSync", category: "SafariExtensionHandler")
    
    func beginRequest(with context: NSExtensionContext) {
        guard let item = context.inputItems.first as? NSExtensionItem,
              let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any] else {
            context.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }
        
        logger.debug("Received message from extension: \(message)")
        
        if let command = message["command"] as? String {
            switch command {
            case "syncHistory":
                handleSyncHistory(context: context)
            default:
                let response = ["error": "Unknown command: \(command)"] as [String: Any]
                respondWithMessage(message: response, context: context)
            }
        } else {
            let response = ["error": "No command specified"] as [String: Any]
            respondWithMessage(message: response, context: context)
        }
    }
    
    // Handle syncing history
    private func handleSyncHistory(context: NSExtensionContext) {
        logger.debug("Starting history sync")
        
        // Create a WKWebsiteDataStore to access browsing history
        let dataStore = WKWebsiteDataStore.default()
        
        // Get the current date and a date from 30 days ago (or adjust as needed)
        let now = Date()
        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: now) ?? now
        
        // Fetch history data
        fetchHistoryData(dataStore: dataStore, from: thirtyDaysAgo, to: now) { result in
            switch result {
            case .success(let historyItems):
                // Format the history data
                let formattedHistory = self.formatHistoryData(historyItems)
                
                // Create the response with the history data
                let response = [
                    "success": true,
                    "message": "History sync completed",
                    "data": formattedHistory
                ] as [String: Any]
                
                self.logger.debug("History sync completed with \(historyItems.count) items")
                self.respondWithMessage(message: response, context: context)
                
            case .failure(let error):
                // Handle the error
                let response = [
                    "success": false,
                    "message": "History sync failed",
                    "error": error.localizedDescription
                ] as [String: Any]
                
                self.logger.error("History sync failed: \(error.localizedDescription)")
                self.respondWithMessage(message: response, context: context)
            }
        }
    }
    
    // Fetch history data from WKWebsiteDataStore
    private func fetchHistoryData(dataStore: WKWebsiteDataStore, from startDate: Date, to endDate: Date, completion: @escaping (Result<[HistoryItem], Error>) -> Void) {
        // Create a fetch request for history items
        let fetchRequest = WKWebsiteDataStore.FetchOptions()
        fetchRequest.includeHttpOnlyCookies = false
        
        // In a real implementation, we would use the WKWebsiteDataStore API to fetch history
        // However, direct access to browsing history is limited in iOS for privacy reasons
        
        // For Safari extensions, we need to use the Safari Web Extension API
        // which provides limited access to browsing data
        
        // This is a simulated implementation since direct history access is restricted
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                // Attempt to access history data through available APIs
                // Note: This is where you would implement the actual history fetching logic
                // based on the available APIs and permissions
                
                // For demonstration purposes, we'll create some sample history items
                // In a real implementation, you would fetch actual history data
                let historyItems = self.getSampleHistoryItems(from: startDate, to: endDate)
                
                // Return the history items
                completion(.success(historyItems))
            } catch {
                completion(.failure(error))
            }
        }
    }
    
    // Format history data for the response
    private func formatHistoryData(_ historyItems: [HistoryItem]) -> [[String: Any]] {
        return historyItems.map { item in
            return [
                "url": item.url,
                "title": item.title,
                "visitTime": item.visitTime.timeIntervalSince1970 * 1000, // Convert to milliseconds
                "visitId": item.visitId,
                "deviceInfo": [
                    "deviceName": UIDevice.current.name,
                    "deviceModel": UIDevice.current.model,
                    "systemName": UIDevice.current.systemName,
                    "systemVersion": UIDevice.current.systemVersion
                ]
            ]
        }
    }
    
    // Helper method to create sample history items for demonstration
    // In a real implementation, this would be replaced with actual history data
    private func getSampleHistoryItems(from startDate: Date, to endDate: Date) -> [HistoryItem] {
        // This is just for demonstration purposes
        // In a real implementation, you would fetch actual history data
        
        let sampleUrls = [
            "https://www.apple.com",
            "https://developer.apple.com",
            "https://www.github.com",
            "https://www.stackoverflow.com",
            "https://www.google.com"
        ]
        
        let sampleTitles = [
            "Apple",
            "Apple Developer",
            "GitHub",
            "Stack Overflow",
            "Google"
        ]
        
        var historyItems: [HistoryItem] = []
        
        // Generate random history items between the start and end dates
        for i in 0..<20 {
            let randomIndex = Int.random(in: 0..<sampleUrls.count)
            let randomTimeInterval = Double.random(in: startDate.timeIntervalSince1970...endDate.timeIntervalSince1970)
            let visitTime = Date(timeIntervalSince1970: randomTimeInterval)
            
            let historyItem = HistoryItem(
                url: sampleUrls[randomIndex],
                title: sampleTitles[randomIndex],
                visitTime: visitTime,
                visitId: "visit_\(i)"
            )
            
            historyItems.append(historyItem)
        }
        
        // Sort by visit time (newest first)
        return historyItems.sorted { $0.visitTime > $1.visitTime }
    }
    
    // Helper method to respond with a message
    private func respondWithMessage(message: [String: Any], context: NSExtensionContext) {
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: message ]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}

// Model for history items
struct HistoryItem {
    let url: String
    let title: String
    let visitTime: Date
    let visitId: String
}

// Custom error types for history sync
enum HistorySyncError: Error {
    case accessDenied
    case dataFetchFailed
    case invalidData
    
    var localizedDescription: String {
        switch self {
        case .accessDenied:
            return "Access to browsing history was denied"
        case .dataFetchFailed:
            return "Failed to fetch browsing history data"
        case .invalidData:
            return "The browsing history data is invalid or corrupted"
        }
    }
}