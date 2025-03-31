# Xcode Project Setup Guide for ChronicleSync Safari Extension

This guide provides step-by-step instructions for setting up an Xcode project to create a Safari extension for iOS.

## Creating a New Xcode Project

1. Open Xcode and select "Create a new Xcode project"
2. Choose "iOS" as the platform and select "App" as the template
3. Click "Next"
4. Enter the following details:
   - Product Name: ChronicleSync
   - Team: Select your development team
   - Organization Identifier: com.yourcompany (replace with your identifier)
   - Bundle Identifier: will be automatically generated
   - Language: Swift
   - User Interface: SwiftUI
   - Uncheck "Use Core Data" and "Include Tests"
5. Click "Next" and choose a location to save the project
6. Click "Create"

## Adding the Safari Extension Target

1. In Xcode, go to File > New > Target
2. Select "Safari Extension" under the "iOS" tab
3. Click "Next"
4. Enter the following details:
   - Product Name: ChronicleSync Extension
   - Team: Same as your main app
   - Organization Identifier: Same as your main app
   - Bundle Identifier: will be automatically generated
   - Language: Swift
5. Click "Finish"
6. If prompted to activate the scheme, click "Activate"

## Configuring the Safari Extension

1. In the Project Navigator, select the Safari Extension target
2. Go to the "General" tab and ensure:
   - Deployment Info is set to iOS 14.0 or later
   - App Category is set to "Utilities" or appropriate category

3. Go to the "Signing & Capabilities" tab:
   - Ensure "Automatically manage signing" is checked
   - Select your development team

4. Add the "App Groups" capability:
   - Click the "+" button in the Capabilities section
   - Select "App Groups"
   - Click the "+" button under App Groups and create a group identifier (e.g., "group.com.yourcompany.chroniclesync")
   - Add the same App Group to both the main app and extension targets

## Importing the Extension Files

1. In the Project Navigator, select the Safari Extension target
2. Delete the default "Resources" folder (right-click > Delete > Move to Trash)
3. Right-click on the Safari Extension target and select "Add Files to [Target]..."
4. Navigate to the location of your extracted ChronicleSync-Safari-Extension.zip files
5. Select all files and ensure:
   - "Copy items if needed" is checked
   - "Create groups" is selected
   - Your Safari Extension target is checked under "Add to targets"
6. Click "Add"

## Configuring Info.plist

1. In the Project Navigator, find the Info.plist file for your Safari Extension target
2. Add or modify the following entries:
   - NSExtension > NSExtensionPointIdentifier: com.apple.Safari.web-extension
   - NSExtension > SFSafariWebsiteAccess > Level: All
   - NSExtension > SFSafariContentScript: Add an array with your content script entries

## Creating the Swift Interface

1. Open the SafariWebExtensionHandler.swift file
2. Replace its contents with:

```swift
import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any]
        
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@", message ?? [:])
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response": "Received" ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
```

## Configuring the Main App

1. Open the main app's ContentView.swift file
2. Replace its contents with:

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "safari")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 100, height: 100)
                .foregroundColor(.blue)
            
            Text("ChronicleSync")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Safari Extension")
                .font(.title2)
            
            Spacer().frame(height: 30)
            
            Text("To enable the extension:")
                .font(.headline)
            
            VStack(alignment: .leading, spacing: 10) {
                Text("1. Open Settings app")
                Text("2. Go to Safari > Extensions")
                Text("3. Enable ChronicleSync Extension")
                Text("4. Allow permissions when prompted")
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(10)
            
            Spacer()
            
            Text("© 2025 ChronicleSync")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding()
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
```

## Building and Testing

1. Select the main app scheme from the scheme selector
2. Choose an iOS device or simulator as the destination
3. Click the "Run" button to build and run the app
4. Once the app is running:
   - Open Safari
   - Go to Settings > Safari > Extensions
   - Enable your extension
   - Test the extension functionality

## Troubleshooting

- If you encounter build errors, check that all files are properly added to the target
- Ensure all required permissions are set in the Info.plist
- For debugging, use Safari's Web Inspector (enable in Settings > Safari > Advanced > Web Inspector)
- Check the console logs for any error messages