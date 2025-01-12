import SafariServices

class SafariExtensionViewController: SFSafariExtensionViewController {
    static let shared = SafariExtensionViewController()
}

class SafariExtensionHandler: SFSafariExtensionHandler {
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        // Handle messages from the web page
        switch messageName {
        case "syncHistory":
            handleHistorySync(userInfo: userInfo)
        default:
            break
        }
    }
    
    private func handleHistorySync(userInfo: [String: Any]?) {
        // Implement history sync logic here
    }
    
    override func toolbarItemClicked(in window: SFSafariWindow) {
        // When the extension's toolbar item is clicked
        window.getActiveTab { tab in
            tab?.getActivePage { page in
                // Show the extension's UI
                SFSafariApplication.getActiveWindow { window in
                    window?.getToolbarItem { item in
                        item?.showPopover()
                    }
                }
            }
        }
    }
    
    override func validateToolbarItem(in window: SFSafariWindow, validationHandler: @escaping ((Bool, String) -> Void)) {
        // Return whether the extension's toolbar item should be enabled
        validationHandler(true, "")
    }
}