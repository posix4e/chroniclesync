import Foundation
import SafariServices

class ExtensionCommunicationService {
    static let shared = ExtensionCommunicationService()
    
    private let extensionBundleIdentifier = "com.chroniclesync.ChronicleSync.Extension"
    
    private init() {}
    
    func sendMessageToExtension(message: [String: Any], completion: @escaping (Result<[String: Any], Error>) -> Void) {
        SFSafariApplication.getActiveWindow { safariWindow in
            safariWindow?.getActiveTab { safariTab in
                safariTab?.getActivePage { safariPage in
                    safariPage?.dispatchMessageToScript(withName: "fromApp", userInfo: message) { response in
                        if let response = response as? [String: Any] {
                            completion(.success(response))
                        } else if let error = response as? Error {
                            completion(.failure(error))
                        } else {
                            completion(.failure(NSError(domain: "ExtensionCommunicationService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])))
                        }
                    }
                }
            }
        }
    }
    
    func checkExtensionStatus(completion: @escaping (Bool) -> Void) {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { state, error in
            if let error = error {
                print("Error checking extension status: \(error)")
                completion(false)
                return
            }
            
            guard let state = state else {
                completion(false)
                return
            }
            
            completion(state.isEnabled)
        }
    }
    
    func openExtensionPreferences() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            if let error = error {
                print("Error opening Safari extension preferences: \(error)")
            }
        }
    }
}