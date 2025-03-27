import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    let logger = Logger(subsystem: "xyz.chroniclesync.safari-extension", category: "extension")
    
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as? NSExtensionItem
        
        guard let message = item?.userInfo?[SFExtensionMessageKey] as? [String: Any] else {
            context.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }
        
        logger.log("Received message from browser.runtime.sendNativeMessage: \(message)")
        
        let response = NSExtensionItem()
        response.userInfo = [SFExtensionMessageKey: ["Response": "Received message from Safari App Extension"]]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}