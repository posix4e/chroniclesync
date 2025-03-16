import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    let logger = Logger(subsystem: "com.chroniclesync.app.extension", category: "extension")
    
    override init() {
        super.init()
        logger.log("SafariWebExtensionHandler initialized")
        
        // Log bundle information
        let bundle = Bundle(for: type(of: self))
        logger.log("Extension bundle identifier: \(bundle.bundleIdentifier ?? "Unknown")")
        
        // Check for resources
        if let resourcesPath = bundle.resourcePath {
            logger.log("Resources path: \(resourcesPath)")
            
            // Check for manifest.json
            let manifestPath = resourcesPath + "/Resources/manifest.json"
            if FileManager.default.fileExists(atPath: manifestPath) {
                logger.log("manifest.json found at: \(manifestPath)")
            } else {
                logger.log("ERROR: manifest.json not found at: \(manifestPath)")
            }
            
            // List files in Resources directory
            let resourcesDir = resourcesPath + "/Resources"
            if FileManager.default.fileExists(atPath: resourcesDir) {
                do {
                    let files = try FileManager.default.contentsOfDirectory(atPath: resourcesDir)
                    logger.log("Files in Resources directory: \(files)")
                } catch {
                    logger.log("Error listing files in Resources directory: \(error.localizedDescription)")
                }
            } else {
                logger.log("ERROR: Resources directory not found at: \(resourcesDir)")
            }
        } else {
            logger.log("ERROR: Resources path not found")
        }
    }
    
    func beginRequest(with context: NSExtensionContext) {
        logger.log("beginRequest called")
        
        guard context.inputItems.count > 0 else {
            logger.log("ERROR: No input items in context")
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "error": "No input items" ] ]
            context.completeRequest(returningItems: [response], completionHandler: nil)
            return
        }
        
        guard let item = context.inputItems[0] as? NSExtensionItem else {
            logger.log("ERROR: First input item is not an NSExtensionItem")
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "error": "Invalid input item type" ] ]
            context.completeRequest(returningItems: [response], completionHandler: nil)
            return
        }
        
        let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any]
        
        logger.log("Received message from browser.runtime.sendNativeMessage: \(message ?? [:])")
        
        // Create a more detailed response
        let response = NSExtensionItem()
        let responseDict: [String: Any] = [
            "Response to": message?["message"] ?? "",
            "timestamp": Date().timeIntervalSince1970,
            "extensionInfo": [
                "bundleID": Bundle(for: type(of: self)).bundleIdentifier ?? "Unknown",
                "hasResources": FileManager.default.fileExists(atPath: (Bundle(for: type(of: self)).resourcePath ?? "") + "/Resources")
            ]
        ]
        
        response.userInfo = [ SFExtensionMessageKey: responseDict ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}