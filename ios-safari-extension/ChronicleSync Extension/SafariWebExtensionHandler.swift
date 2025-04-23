import SafariServices
import os.log
import UIKit

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    let logger = Logger(subsystem: "xyz.chroniclesync.ios.extension", category: "extension")
    
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as? NSExtensionItem
        
        guard let message = item?.userInfo?[SFExtensionMessageKey] as? [String: Any] else {
            logger.error("Failed to receive message from Safari Web Extension")
            context.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }
        
        logger.debug("Received message from Safari Web Extension: \(message)")
        
        // Handle messages from the extension
        if let messageType = message["type"] as? String {
            switch messageType {
            case "getClientId":
                handleGetClientId(context: context)
                
            case "saveClientId":
                if let clientId = message["clientId"] as? String {
                    handleSaveClientId(clientId: clientId, context: context)
                } else {
                    respondWithError(message: "Missing clientId parameter", context: context)
                }
                
            case "syncHistory":
                handleSyncHistory(context: context)
                
            case "getDeviceInfo":
                handleGetDeviceInfo(context: context)
                
            default:
                logger.error("Unknown message type: \(messageType)")
                respondWithError(message: "Unknown message type", context: context)
            }
        } else {
            logger.error("Message type not specified")
            respondWithError(message: "Message type not specified", context: context)
        }
    }
    
    // Handle getting the client ID
    private func handleGetClientId(context: NSExtensionContext) {
        let clientId = UserDefaults.standard.string(forKey: "clientId") ?? ""
        
        let response = ["clientId": clientId]
        respondWithMessage(message: response, context: context)
    }
    
    // Handle saving the client ID
    private func handleSaveClientId(clientId: String, context: NSExtensionContext) {
        UserDefaults.standard.set(clientId, forKey: "clientId")
        
        let response = ["success": true]
        respondWithMessage(message: response, context: context)
    }
    
    // Handle syncing history
    private func handleSyncHistory(context: NSExtensionContext) {
        // In a real implementation, this would interact with the native iOS history API
        // For now, we'll just return a success message
        let response = ["success": true, "message": "History sync initiated"] as [String : Any]
        respondWithMessage(message: response, context: context)
    }
    
    // Handle getting device information
    private func handleGetDeviceInfo(context: NSExtensionContext) {
        let deviceName = UIDevice.current.name
        let deviceModel = UIDevice.current.model
        let systemName = UIDevice.current.systemName
        let systemVersion = UIDevice.current.systemVersion
        
        let deviceInfo: [String: Any] = [
            "deviceName": deviceName,
            "deviceModel": deviceModel,
            "deviceType": "mobile",
            "browser": "safari",
            "platform": systemName.lowercased(),
            "version": systemVersion
        ]
        
        respondWithMessage(message: deviceInfo, context: context)
    }
    
    // Helper method to respond with a message
    private func respondWithMessage(message: [String: Any], context: NSExtensionContext) {
        let response = NSExtensionItem()
        response.userInfo = [SFExtensionMessageKey: message]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
    // Helper method to respond with an error
    private func respondWithError(message: String, context: NSExtensionContext) {
        let response = NSExtensionItem()
        response.userInfo = [SFExtensionMessageKey: ["error": message]]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
