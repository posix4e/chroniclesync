# Testing the ChronicleSync Safari iOS Extension

This document provides instructions for testing the ChronicleSync Safari iOS extension using TestFlight.

## Prerequisites

- An Apple Developer account with access to App Store Connect
- Xcode 14.0 or later installed on a Mac
- An iOS device running iOS 16.0 or later

## Building and Uploading to TestFlight

1. **Build the Safari extension package**

   Run the build script to create the Safari extension package:

   ```bash
   ./build-safari-ios.sh
   ```

2. **Open the Xcode project on a Mac**

   ```bash
   open ChronicleSync.xcodeproj
   ```

3. **Configure your Apple Developer account**

   - In Xcode, select the project in the Project Navigator
   - Select the "ChronicleSync" target
   - Go to the "Signing & Capabilities" tab
   - Select your team from the dropdown

4. **Create an Archive for TestFlight**

   - Select Product > Archive in Xcode
   - Once the archive is complete, click "Distribute App"
   - Select "App Store Connect" and follow the prompts
   - Choose "Upload" to send the build to App Store Connect

5. **Configure TestFlight in App Store Connect**

   - Log in to [App Store Connect](https://appstoreconnect.apple.com/)
   - Navigate to "Apps" > "ChronicleSync" > "TestFlight"
   - Wait for the build to finish processing (this may take some time)
   - Add test information (what to test, etc.)

6. **Add Testers**

   - In the TestFlight tab, click "Add Testers"
   - You can add internal testers (people in your organization) or external testers
   - For external testers, you'll need to provide additional information and wait for Apple's review

## Testing the Extension

Once testers receive the TestFlight invitation and install the app:

1. **Enable the Extension**

   - Open the Settings app on the iOS device
   - Navigate to Safari > Extensions
   - Find "ChronicleSync" and toggle it on

2. **Test the Extension**

   - Open Safari
   - Navigate to a website
   - Tap the "Aa" button in the address bar
   - Select "ChronicleSync" from the menu
   - The extension should now be active

3. **Verify Functionality**

   - Test all the features of the extension
   - Make sure it works as expected on different websites
   - Check that it syncs data correctly

4. **Provide Feedback**

   - Use the TestFlight app to provide feedback
   - Include screenshots if possible
   - Report any bugs or issues

## Troubleshooting

- If the extension doesn't appear in Safari, make sure it's enabled in Settings
- If the extension crashes, check the logs in Xcode
- If the extension doesn't work as expected, try restarting Safari
- Make sure you're using the latest version of iOS