import SafariServices
import os.log
import WebKit

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    let storageAdapter = StorageAdapter()
    let contentSummarizer = ContentSummarizer()
    
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
                
            case "summarizeContent":
                if let url = message["url"] as? String {
                    // Create a temporary WebView to load the page for native summarization
                    let webView = WKWebView(frame: .zero)
                    if let pageURL = URL(string: url) {
                        webView.load(URLRequest(url: pageURL))
                        
                        // Wait for page to load
                        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
                            guard let self = self else { return }
                            
                            // Use native iOS summarization
                            self.contentSummarizer.summarizeWebContent(in: webView) { result in
                                switch result {
                                case .success(let summary):
                                    // Store the content summary
                                    self.storageAdapter.updatePageContent(
                                        url: url,
                                        content: summary.content,
                                        summary: summary.summary
                                    )
                                    
                                    // Send response with the summary
                                    self.sendResponse(context: context, response: [
                                        "success": true,
                                        "summary": summary.toDictionary()
                                    ])
                                    
                                case .failure(let error):
                                    self.sendResponse(context: context, response: [
                                        "error": "Failed to summarize content: \(error.localizedDescription)"
                                    ])
                                }
                            }
                        }
                    } else {
                        sendResponse(context: context, response: ["error": "Invalid URL"])
                    }
                } else {
                    sendResponse(context: context, response: ["error": "URL is required for content summarization"])
                }
                
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