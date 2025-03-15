import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    let logger = Logger(subsystem: "xyz.chroniclesync.ios.extension", category: "Extension")

    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any]
        
        logger.debug("Received message from browser.runtime.sendNativeMessage: \(String(describing: message))")
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response": "Received message from Safari App Extension" ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}