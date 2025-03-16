import SafariServices
import os.log

/// Handler for Safari web extension requests
class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    /// Logger for debugging
    private let logger = Logger(subsystem: "com.chroniclesync.app.extension", category: "extension")
    
    /// Path to the Resources directory
    private var resourcesDirectory: String?
    
    override init() {
        super.init()
        logger.log("SafariWebExtensionHandler initialized")
        
        // Log bundle information
        let bundle = Bundle(for: type(of: self))
        logger.log("Extension bundle identifier: \(bundle.bundleIdentifier ?? "Unknown")")
        
        // Check for resources
        if let resourcesPath = bundle.resourcePath {
            logger.log("Resources path: \(resourcesPath)")
            
            // Store the resources directory path
            resourcesDirectory = resourcesPath + "/Resources"
            
            // Check for manifest.json
            let manifestPath = resourcesPath + "/Resources/manifest.json"
            if FileManager.default.fileExists(atPath: manifestPath) {
                logger.log("manifest.json found at: \(manifestPath)")
            } else {
                logger.error("manifest.json not found at: \(manifestPath)")
            }
            
            // List files in Resources directory
            let resourcesDir = resourcesPath + "/Resources"
            if FileManager.default.fileExists(atPath: resourcesDir) {
                do {
                    let files = try FileManager.default.contentsOfDirectory(atPath: resourcesDir)
                    logger.log("Files in Resources directory: \(files)")
                } catch {
                    logger.error("Error listing files in Resources directory: \(error.localizedDescription)")
                }
            } else {
                logger.error("Resources directory not found at: \(resourcesDir)")
            }
        } else {
            logger.error("Resources path not found")
        }
    }
    
    /// Handles requests from the Safari web extension
    /// - Parameter context: The extension context
    func beginRequest(with context: NSExtensionContext) {
        logger.log("beginRequest called")
        
        guard context.inputItems.count > 0 else {
            logger.error("No input items in context")
            sendErrorResponse(to: context, error: "No input items")
            return
        }
        
        guard let item = context.inputItems[0] as? NSExtensionItem else {
            logger.error("First input item is not an NSExtensionItem")
            sendErrorResponse(to: context, error: "Invalid input item type")
            return
        }
        
        let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any]
        
        logger.log("Received message from browser.runtime.sendNativeMessage: \(message ?? [:])")
        
        // Create a more detailed response
        let response = NSExtensionItem()
        let responseDict: [String: Any] = [
            "Response to": message?["message"] ?? "",
            "timestamp": Date().timeIntervalSince1970,
            "extensionInfo": getExtensionInfo()
        ]
        
        response.userInfo = [ SFExtensionMessageKey: responseDict ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
    // MARK: - Helper Methods
    
    /// Sends an error response to the extension context
    /// - Parameters:
    ///   - context: The extension context
    ///   - error: The error message
    private func sendErrorResponse(to context: NSExtensionContext, error: String) {
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "error": error ] ]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
    /// Gets information about the extension
    /// - Returns: A dictionary with extension information
    private func getExtensionInfo() -> [String: Any] {
        let bundle = Bundle(for: type(of: self))
        let bundleID = bundle.bundleIdentifier ?? "Unknown"
        let hasResources = resourcesDirectory != nil && 
                          FileManager.default.fileExists(atPath: resourcesDirectory!)
        
        var info: [String: Any] = [
            "bundleID": bundleID,
            "hasResources": hasResources
        ]
        
        // Add version information if available
        if let version = bundle.infoDictionary?["CFBundleShortVersionString"] as? String {
            info["version"] = version
        }
        
        return info
    }
}