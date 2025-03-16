import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    enum MessageType: String {
        case getHistory = "getHistory"
        case saveHistory = "saveHistory"
        case clearHistory = "clearHistory"
        case getSettings = "getSettings"
        case saveSettings = "saveSettings"
        case unknown
    }
    
    let logger = OSLog(subsystem: "xyz.chroniclesync.app.extension", category: "SafariWebExtensionHandler")

    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        
        guard let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any] else {
            os_log(.error, log: logger, "Error: Message from browser.runtime.sendNativeMessage is not a dictionary")
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "error": "Invalid message format" ] ]
            context.completeRequest(returningItems: [response], completionHandler: nil)
            return
        }
        
        os_log(.default, log: logger, "Received message from browser.runtime.sendNativeMessage: %{public}@", message as CVarArg)
        
        // Process the message based on its type
        guard let typeString = message["type"] as? String,
              let type = MessageType(rawValue: typeString) ?? .unknown else {
            handleUnknownMessage(message, context: context)
            return
        }
        
        switch type {
        case .getHistory:
            handleGetHistory(message, context: context)
        case .saveHistory:
            handleSaveHistory(message, context: context)
        case .clearHistory:
            handleClearHistory(message, context: context)
        case .getSettings:
            handleGetSettings(message, context: context)
        case .saveSettings:
            handleSaveSettings(message, context: context)
        case .unknown:
            handleUnknownMessage(message, context: context)
        }
    }
    
    // MARK: - Message Handlers
    
    private func handleGetHistory(_ message: [String: Any], context: NSExtensionContext) {
        os_log(.debug, log: logger, "Handling getHistory message")
        
        // For now, just return an empty history array
        // In a real implementation, you would fetch history from local storage
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ 
            "type": "getHistoryResponse",
            "history": [],
            "success": true
        ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
    private func handleSaveHistory(_ message: [String: Any], context: NSExtensionContext) {
        os_log(.debug, log: logger, "Handling saveHistory message")
        
        guard let historyItems = message["history"] as? [[String: Any]] else {
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ 
                "type": "saveHistoryResponse",
                "success": false,
                "error": "Invalid history data"
            ] ]
            context.completeRequest(returningItems: [response], completionHandler: nil)
            return
        }
        
        // For now, just log the history items
        // In a real implementation, you would save them to local storage
        os_log(.debug, log: logger, "Would save %d history items", historyItems.count)
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ 
            "type": "saveHistoryResponse",
            "success": true
        ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
    private func handleClearHistory(_ message: [String: Any], context: NSExtensionContext) {
        os_log(.debug, log: logger, "Handling clearHistory message")
        
        // For now, just acknowledge the request
        // In a real implementation, you would clear history from local storage
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ 
            "type": "clearHistoryResponse",
            "success": true
        ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
    private func handleGetSettings(_ message: [String: Any], context: NSExtensionContext) {
        os_log(.debug, log: logger, "Handling getSettings message")
        
        // For now, return default settings
        // In a real implementation, you would fetch settings from local storage
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ 
            "type": "getSettingsResponse",
            "settings": [
                "syncEnabled": true,
                "syncFrequency": "automatic",
                "dataUsage": "wifi-only",
                "notifications": true
            ],
            "success": true
        ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
    private func handleSaveSettings(_ message: [String: Any], context: NSExtensionContext) {
        os_log(.debug, log: logger, "Handling saveSettings message")
        
        guard let settings = message["settings"] as? [String: Any] else {
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ 
                "type": "saveSettingsResponse",
                "success": false,
                "error": "Invalid settings data"
            ] ]
            context.completeRequest(returningItems: [response], completionHandler: nil)
            return
        }
        
        // For now, just log the settings
        // In a real implementation, you would save them to local storage
        os_log(.debug, log: logger, "Would save settings: %{public}@", settings as CVarArg)
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ 
            "type": "saveSettingsResponse",
            "success": true
        ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
    private func handleUnknownMessage(_ message: [String: Any], context: NSExtensionContext) {
        os_log(.error, log: logger, "Received unknown message type")
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ 
            "error": "Unknown message type",
            "originalMessage": message
        ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}