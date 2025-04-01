import SafariServices
import Foundation

let SFExtensionMessageKey = "SFExtensionMessage"

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let startTime = Date()
        
        guard let item = context.inputItems.first as? NSExtensionItem,
              let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any] else {
            // Handle invalid message
            let errorEvent = ErrorEvent(
                code: "invalid_message",
                message: "Received invalid message format",
                context: ["source": "beginRequest"]
            )
            TrackingManager.shared.trackError(errorEvent)
            
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "error": "Invalid message format" ] ]
            context.completeRequest(returningItems: [response], completionHandler: nil)
            return
        }
        
        // Track the received message
        if let action = message["action"] as? String {
            let messageSize = estimateMessageSize(message)
            let messageOperation = MessageOperation(
                type: .received,
                action: action,
                size: messageSize
            )
            TrackingManager.shared.trackMessageOperation(messageOperation)
            
            // Process the message based on the action
            processMessage(message, context: context, startTime: startTime)
        } else {
            // Handle message with no action
            let errorEvent = ErrorEvent(
                code: "no_action",
                message: "Received message with no action",
                context: ["source": "beginRequest"]
            )
            TrackingManager.shared.trackError(errorEvent)
            
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "error": "No action specified" ] ]
            context.completeRequest(returningItems: [response], completionHandler: nil)
        }
    }
    
    private func processMessage(_ message: [String: Any], context: NSExtensionContext, startTime: Date) {
        guard let action = message["action"] as? String else {
            return
        }
        
        var responseData: [String: Any] = ["success": true]
        
        switch action {
        case "sync":
            // Handle sync action
            if let type = message["syncType"] as? String,
               let itemCount = message["itemCount"] as? Int {
                let syncType: SyncOperation.SyncType = (type == "full") ? .full : .incremental
                
                // Perform sync operation
                // ...
                
                // Track the sync operation
                let endTime = Date()
                let duration = endTime.timeIntervalSince(startTime)
                let syncOperation = SyncOperation(
                    type: syncType,
                    itemCount: itemCount,
                    duration: duration
                )
                TrackingManager.shared.trackSyncOperation(syncOperation)
                
                responseData["syncedItems"] = itemCount
            }
            
        case "getData":
            // Handle getData action
            if let key = message["key"] as? String {
                // Get data for the key
                // ...
                
                responseData["data"] = ["key": key, "value": "sample data"]
            }
            
        case "setData":
            // Handle setData action
            if let key = message["key"] as? String,
               let value = message["value"] {
                // Set data for the key
                // ...
                
                responseData["key"] = key
            }
            
        default:
            // Handle unknown action
            let errorEvent = ErrorEvent(
                code: "unknown_action",
                message: "Received unknown action: \(action)",
                context: ["source": "processMessage"]
            )
            TrackingManager.shared.trackError(errorEvent)
            
            responseData = ["success": false, "error": "Unknown action: \(action)"]
        }
        
        // Send response
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: responseData ]
        
        // Track the sent message
        let responseSize = estimateMessageSize(responseData)
        let messageOperation = MessageOperation(
            type: .sent,
            action: "response_to_\(action)",
            size: responseSize
        )
        TrackingManager.shared.trackMessageOperation(messageOperation)
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
    private func estimateMessageSize(_ message: [String: Any]) -> Int {
        // A simple estimation of message size
        // In a real implementation, you would use JSONSerialization to get the exact size
        return String(describing: message).count
    }
}
