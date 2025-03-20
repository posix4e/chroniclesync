import SafariServices

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response": "Received message" ] ]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}