# ChronicleSync Safari Extension for iOS

This directory contains the files needed to create a Safari extension for iOS from the ChronicleSync Chrome extension.

## Building the Safari Extension

1. Run the build script to prepare the extension files:

```bash
# Make the build script executable
chmod +x build-safari-extension.js

# Run the build script
node build-safari-extension.js
```

This will create a directory `ChronicleSync` with all the necessary files for the Safari extension.

## Creating the Xcode Project

1. Open Xcode and create a new project.
2. Select "Safari Extension App" as the template.
3. Name your project "ChronicleSync" and configure the other settings as needed.
4. Once the project is created, you'll need to:
   - Delete the default `Resources` folder in the Safari Extension target
   - Add the files from the `ChronicleSync` directory to the Safari Extension target

## Xcode Project Configuration

1. In the Safari Extension target's `Info.plist`, make sure to:
   - Set `NSExtension > SFSafariWebsiteAccess > Level` to `All`
   - Add the necessary domains to `NSExtension > SFSafariWebsiteAccess > Allowed Domains` if you want to restrict access

2. In the App target's `Info.plist`, add:
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
       <key>NSAllowsArbitraryLoads</key>
       <true/>
   </dict>
   ```

3. Configure the App Group and other entitlements as needed.

## Testing the Extension

1. Build and run the app on an iOS simulator or device.
2. Open Safari and go to Settings > Extensions to enable your extension.
3. Test the extension functionality.

## Known Limitations

- Safari on iOS has more restrictions than desktop Safari or Chrome.
- Some Chrome APIs may not be fully supported, even with the adapter.
- The `history` API is not available in Safari extensions on iOS.
- The `unlimitedStorage` permission is not available in Safari.

## Troubleshooting

- If you encounter issues with API compatibility, check the `safari-api-adapter.js` file and modify it as needed.
- For debugging, you can use Safari's Web Inspector to debug the extension on iOS devices.
- Make sure all the necessary permissions are configured in the extension manifest and Xcode project.