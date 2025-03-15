//
//  SafariWebExtensionHandler.swift
//  ChronicleSync Extension
//
//  Created by alex newman on 3/15/25.
//

import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    let logger = Logger(subsystem: "com.chroniclesync.ChronicleSync.Extension", category: "Extension")
    
    func beginRequest(with context: NSExtensionContext) {
        guard let item = context.inputItems.first as? NSExtensionItem,
              let message = item.userInfo?[SFExtensionMessageKey] else {
            context.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }
        
        logger.log("Received message from browser.runtime.sendNativeMessage: \(String(describing: message))")
        
        // Process the message from the JavaScript extension
        processMessage(message as? [String: Any]) { response in
            let responseItem = NSExtensionItem()
            responseItem.userInfo = [SFExtensionMessageKey: response]
            context.completeRequest(returningItems: [responseItem], completionHandler: nil)
        }
    }
    
    private func processMessage(_ message: [String: Any]?, completion: @escaping ([String: Any]) -> Void) {
        guard let message = message,
              let type = message["type"] as? String else {
            completion(["error": "Invalid message format"])
            return
        }
        
        switch type {
        case "SAVE_HISTORY":
            if let data = message["data"] as? [String: Any] {
                saveHistory(data) { result in
                    completion(result)
                }
            } else {
                completion(["error": "Missing data for SAVE_HISTORY"])
            }
            
        case "GET_SETTINGS":
            getSettings { settings in
                completion(["settings": settings])
            }
            
        case "SYNC_NOW":
            syncNow { result in
                completion(result)
            }
            
        default:
            completion(["error": "Unknown message type: \(type)"])
        }
    }
    
    private func saveHistory(_ data: [String: Any], completion: @escaping ([String: Any]) -> Void) {
        // In a real implementation, you would save the history data
        // For now, just log it and return success
        logger.log("Saving history: \(data)")
        
        // Store in UserDefaults for demo purposes
        let timestamp = Date().timeIntervalSince1970
        let key = "history_\(timestamp)"
        
        var histories = UserDefaults.standard.dictionary(forKey: "syncHistories") as? [String: Any] ?? [:]
        histories[key] = data
        UserDefaults.standard.set(histories, forKey: "syncHistories")
        
        // Update last sync time
        UserDefaults.standard.set(Date(), forKey: "lastSync")
        
        completion(["status": "success", "timestamp": timestamp])
    }
    
    private func getSettings(completion: @escaping ([String: Any]) -> Void) {
        // Get settings from UserDefaults
        let syncEnabled = UserDefaults.standard.bool(forKey: "syncEnabled")
        let settings: [String: Any] = [
            "syncEnabled": syncEnabled,
            "apiEndpoint": "https://api.chroniclesync.xyz"
        ]
        
        completion(settings)
    }
    
    private func syncNow(completion: @escaping ([String: Any]) -> Void) {
        // In a real implementation, you would trigger a sync
        // For now, just update the last sync time
        UserDefaults.standard.set(Date(), forKey: "lastSync")
        
        completion(["status": "success", "timestamp": Date().timeIntervalSince1970])
    }
}
