import UIKit

// Simple test app to verify iOS functionality
class TestApp {
    static func main() {
        print("Testing iOS app functionality...")
        
        // Check if we can access the bundle
        let bundle = Bundle.main
        print("Bundle identifier: \(bundle.bundleIdentifier ?? "Unknown")")
        
        // Check if we can access the main storyboard
        if let storyboardPath = bundle.path(forResource: "Main", ofType: "storyboardc") {
            print("Found Main.storyboard at: \(storyboardPath)")
        } else {
            print("Main.storyboard not found in bundle")
        }
        
        // Check if we can access the extension resources
        let extensionBundle = Bundle(for: TestApp.self)
        let resourcesPath = extensionBundle.resourcePath?.appending("/Resources")
        if let resourcesPath = resourcesPath, FileManager.default.fileExists(atPath: resourcesPath) {
            print("Extension resources found at: \(resourcesPath)")
            
            // List files in the resources directory
            do {
                let files = try FileManager.default.contentsOfDirectory(atPath: resourcesPath)
                print("Files in Resources directory:")
                for file in files {
                    print("- \(file)")
                }
            } catch {
                print("Error listing files: \(error)")
            }
        } else {
            print("Extension resources not found")
        }
    }
}

// Call the main function
TestApp.main()