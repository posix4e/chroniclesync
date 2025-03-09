import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    let logger = Logger(subsystem: "xyz.chroniclesync.ios.extension", category: "Extension")
    
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any]
        
        logger.log("Received message from browser.runtime.sendNativeMessage: \(message ?? [:])")
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response": "Received message" ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
    // Handle storage operations
    private func handleStorageOperation(_ message: [String: Any], completion: @escaping ([String: Any]) -> Void) {
        guard let operation = message["operation"] as? String else {
            completion(["error": "Missing operation"])
            return
        }
        
        switch operation {
        case "get":
            if let key = message["key"] as? String {
                let value = UserDefaults(suiteName: "group.xyz.chroniclesync")?.object(forKey: key)
                completion(["result": value ?? NSNull()])
            } else {
                completion(["error": "Missing key"])
            }
            
        case "set":
            if let key = message["key"] as? String, let value = message["value"] {
                UserDefaults(suiteName: "group.xyz.chroniclesync")?.set(value, forKey: key)
                completion(["result": true])
            } else {
                completion(["error": "Missing key or value"])
            }
            
        case "remove":
            if let key = message["key"] as? String {
                UserDefaults(suiteName: "group.xyz.chroniclesync")?.removeObject(forKey: key)
                completion(["result": true])
            } else {
                completion(["error": "Missing key"])
            }
            
        default:
            completion(["error": "Unknown operation: \(operation)"])
        }
    }
    
    // Handle history operations
    private func handleHistoryOperation(_ message: [String: Any], completion: @escaping ([String: Any]) -> Void) {
        guard let operation = message["operation"] as? String else {
            completion(["error": "Missing operation"])
            return
        }
        
        switch operation {
        case "addVisit":
            if let url = message["url"] as? String, let title = message["title"] as? String {
                // In a real implementation, we would store this in a database
                logger.log("Adding visit: \(url) - \(title)")
                completion(["result": true])
            } else {
                completion(["error": "Missing url or title"])
            }
            
        case "getVisits":
            // In a real implementation, we would query a database
            completion(["result": []])
            
        default:
            completion(["error": "Unknown operation: \(operation)"])
        }
    }
}