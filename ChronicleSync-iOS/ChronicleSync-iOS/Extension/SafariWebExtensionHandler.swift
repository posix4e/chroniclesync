import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    let storageAdapter = StorageAdapter()
    
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any]
        
        guard let message = message else {
            context.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }
        
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@", message)
        
        // Handle different message types
        if let messageType = message["type"] as? String {
            switch messageType {
            case "addHistoryEntry":
                if let entry = message["entry"] as? [String: Any] {
                    storageAdapter.addHistoryEntry(entry: entry)
                    sendResponse(context: context, response: ["success": true])
                } else {
                    sendResponse(context: context, response: ["error": "Invalid entry data"])
                }
                
            case "getUnsyncedEntries":
                let entries = storageAdapter.getUnsyncedEntries()
                sendResponse(context: context, response: ["entries": entries])
                
            case "markAsSynced":
                if let visitId = message["visitId"] as? String {
                    storageAdapter.markAsSynced(visitId: visitId)
                    sendResponse(context: context, response: ["success": true])
                } else {
                    sendResponse(context: context, response: ["error": "Invalid visitId"])
                }
                
            case "getEntries":
                let deviceId = message["deviceId"] as? String
                let since = message["since"] as? Double
                let entries = storageAdapter.getEntries(deviceId: deviceId, since: since)
                sendResponse(context: context, response: ["entries": entries])
                
            case "mergeRemoteEntries":
                if let entries = message["entries"] as? [[String: Any]] {
                    storageAdapter.mergeRemoteEntries(remoteEntries: entries)
                    sendResponse(context: context, response: ["success": true])
                } else {
                    sendResponse(context: context, response: ["error": "Invalid entries data"])
                }
                
            case "updateDevice":
                if let device = message["device"] as? [String: Any] {
                    storageAdapter.updateDevice(device: device)
                    sendResponse(context: context, response: ["success": true])
                } else {
                    sendResponse(context: context, response: ["error": "Invalid device data"])
                }
                
            case "getDevices":
                let devices = storageAdapter.getDevices()
                sendResponse(context: context, response: ["devices": devices])
                
            case "updatePageContent":
                if let url = message["url"] as? String,
                   let content = message["content"] as? String,
                   let summary = message["summary"] as? String {
                    storageAdapter.updatePageContent(url: url, content: content, summary: summary)
                    sendResponse(context: context, response: ["success": true])
                } else {
                    sendResponse(context: context, response: ["error": "Invalid content data"])
                }
                
            case "searchContent":
                if let query = message["query"] as? String {
                    let results = storageAdapter.searchContent(query: query)
                    sendResponse(context: context, response: ["results": results])
                } else {
                    sendResponse(context: context, response: ["error": "Invalid query"])
                }
                
            default:
                sendResponse(context: context, response: ["error": "Unknown message type"])
            }
        } else {
            sendResponse(context: context, response: ["error": "Missing message type"])
        }
    }
    
    private func sendResponse(context: NSExtensionContext, response: [String: Any]) {
        let responseItem = NSExtensionItem()
        responseItem.userInfo = [SFExtensionMessageKey: response]
        
        context.completeRequest(returningItems: [responseItem], completionHandler: nil)
    }
}