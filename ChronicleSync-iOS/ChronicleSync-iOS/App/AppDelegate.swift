import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    // MARK: UISceneSession Lifecycle

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Called when a new scene session is being created.
        // Use this method to select a configuration to create the new scene with.
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // Called when the user discards a scene session.
        // If any sessions were discarded while the application was not running, this will be called shortly after application:didFinishLaunchingWithOptions.
        // Use this method to release any resources that were specific to the discarded scenes, as they will not return.
    }
    
    // Handle custom URL scheme
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        // Handle the URL scheme
        if url.scheme == "chroniclesync" {
            if url.host == "open" {
                // Open the main app
                return true
            } else if url.host == "settings" {
                // Open settings
                // Navigate to settings screen
                return true
            }
        }
        return false
    }
    
    // Handle background fetch
    func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        // Perform background sync
        let storageAdapter = StorageAdapter()
        
        // Get unsynced entries
        let unsyncedEntries = storageAdapter.getUnsyncedEntries()
        
        if unsyncedEntries.isEmpty {
            completionHandler(.noData)
            return
        }
        
        // Perform sync with backend
        // This would be implemented with a proper API client
        // For now, we'll just mark as synced
        for entry in unsyncedEntries {
            if let visitId = entry["visitId"] as? String {
                storageAdapter.markAsSynced(visitId: visitId)
            }
        }
        
        completionHandler(.newData)
    }
}