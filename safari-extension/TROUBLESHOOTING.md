# iOS Safari Extension Troubleshooting Guide

This guide addresses common issues encountered when setting up, building, and deploying Safari extensions for iOS.

## Common Build and Signing Issues

### 1. "No profiles for ... were found" or "No Accounts: Add a new account in Accounts settings"

**Error messages:**
```
No profiles for '***' were found: Xcode couldn't find any iOS App Development provisioning profiles matching '***'. Automatic signing is disabled and unable to generate a profile.
```

```
No Accounts: Add a new account in Accounts settings.
```

**Possible causes and solutions:**

- **Mismatched bundle identifier:**
  - Ensure the bundle identifier in your Xcode project matches the one in your provisioning profile
  - Verify the `APPLE_APP_ID` secret matches your actual bundle identifier
  - Check: `Xcode > Target > Signing & Capabilities > Bundle Identifier`

- **Missing or expired provisioning profile:**
  - Generate a new provisioning profile in the [Apple Developer Portal](https://developer.apple.com/account/resources/profiles/list)
  - Ensure the profile includes the Safari Extension entitlement
  - Create separate profiles for the main app and the extension
  - Re-encode and update the `APPLE_APP_PROVISIONING_PROFILE` and `APPLE_EXTENSION_PROVISIONING_PROFILE` secrets

- **Incorrect Team ID:**
  - Verify your `APPLE_TEAM_ID` secret matches your Apple Developer Team ID
  - Find your Team ID in the [Apple Developer Portal](https://developer.apple.com/account/#/membership)

- **No Apple ID in CI environment:**
  - For CI environments, use manual signing instead of automatic signing
  - Configure the exportOptions.plist with manual signing:
  ```xml
  <key>signingStyle</key>
  <string>manual</string>
  <key>provisioningProfiles</key>
  <dict>
      <key>com.yourcompany.app</key>
      <string>Profile_Name</string>
      <key>com.yourcompany.app.extension</key>
      <string>Extension_Profile_Name</string>
  </dict>
  ```
  
- **Fix in CI workflow:**
  - Use manual signing with specific provisioning profile names:
  ```yaml
  xcodebuild -project ChronicleSync.xcodeproj -scheme "ChronicleSync" -configuration Release -sdk iphoneos -archivePath "build/ChronicleSync.xcarchive" archive \
    DEVELOPMENT_TEAM="${APPLE_TEAM_ID}" \
    PRODUCT_BUNDLE_IDENTIFIER="${APPLE_APP_ID}" \
    CODE_SIGN_STYLE="Manual" \
    CODE_SIGN_IDENTITY="iPhone Distribution" \
    PROVISIONING_PROFILE_SPECIFIER="ChronicleSync_Profile"
  ```

### 2. "Unable to find a matching code-signing identity"

**Error message:**
```
Unable to find a matching code-signing identity for '***': No code-signing identities (i.e. certificate and private key pairs) matching '***' were found.
```

**Possible causes and solutions:**

- **Certificate not properly installed:**
  - Verify the certificate is correctly installed in the CI environment
  - Check the base64 encoding of your certificate (no line breaks)
  - Ensure the certificate password is correct

- **Expired certificate:**
  - Check certificate expiration in Keychain Access
  - Generate a new certificate in the Apple Developer Portal
  - Re-export, encode, and update the `APPLE_CERTIFICATE_CONTENT` secret

- **Keychain access issues:**
  - Ensure the keychain is unlocked in the CI environment
  - Add debugging to verify certificate installation:
  ```bash
  security find-identity -v -p codesigning
  ```

### 3. "Code signing is required for product type 'Application'"

**Error message:**
```
Code signing is required for product type 'Application' in SDK 'iOS ...'
```

**Possible causes and solutions:**

- **Automatic signing disabled:**
  - Enable automatic signing in exportOptions.plist:
  ```xml
  <key>signingStyle</key>
  <string>automatic</string>
  ```

- **Missing development team:**
  - Ensure `DEVELOPMENT_TEAM` parameter is passed to xcodebuild
  - Verify the team ID is correct

- **Manual signing configuration issues:**
  - If using manual signing, ensure CODE_SIGN_IDENTITY and PROVISIONING_PROFILE_SPECIFIER are set correctly
  - Example:
  ```bash
  xcodebuild ... CODE_SIGN_IDENTITY="iPhone Developer" PROVISIONING_PROFILE_SPECIFIER="YourProfileName"
  ```

## Safari Extension Specific Issues

### 1. "Safari Extension not appearing in Settings"

**Possible causes and solutions:**

- **Extension not properly bundled:**
  - Verify the extension is included in the app bundle
  - Check Info.plist configuration for NSExtension entries

- **Missing entitlements:**
  - Ensure the app has the com.apple.developer.safari-web-extension entitlement
  - Check entitlements file or add it in Xcode under Signing & Capabilities

- **Extension resources missing:**
  - Verify all required extension files are copied to the Resources directory
  - Check the CI workflow copy commands for any errors

### 2. "Extension fails to load or crashes"

**Possible causes and solutions:**

- **JavaScript compatibility issues:**
  - Check for Safari-specific JavaScript incompatibilities
  - Test with Safari's Web Inspector
  - Add console.log statements to debug initialization

- **Missing permissions:**
  - Verify required permissions are declared in the extension manifest
  - Check Info.plist for proper configuration

- **Resource loading issues:**
  - Ensure paths to resources are correct
  - Check for CORS or content security policy issues

## CI/CD Specific Issues

### 1. "Secrets not properly configured"

**Possible causes and solutions:**

- **Missing or invalid secrets:**
  - Verify all required secrets are set in GitHub repository settings
  - Check for any special characters that might need escaping

- **Secret format issues:**
  - Ensure certificates and profiles are properly base64 encoded
  - Avoid line breaks in base64-encoded secrets

- **Debug secret usage:**
  - Add echo statements to verify secret availability (without revealing content)
  ```bash
  if [ -z "$APPLE_TEAM_ID" ]; then echo "APPLE_TEAM_ID is not set"; else echo "APPLE_TEAM_ID is set"; fi
  ```

### 2. "Simulator or device issues"

**Possible causes and solutions:**

- **Simulator not available:**
  - List available simulators:
  ```bash
  xcrun simctl list devices available
  ```

- **Device compatibility:**
  - Ensure the app is built for the correct iOS version
  - Check minimum deployment target in Xcode

## Advanced Debugging Techniques

### 1. Verbose build output

Add verbose flags to xcodebuild for more detailed output:
```bash
xcodebuild -project ChronicleSync.xcodeproj -scheme "ChronicleSync" -configuration Release -sdk iphoneos -verbose
```

### 2. Inspect provisioning profile

Decode and inspect the provisioning profile content:
```bash
security cms -D -i ~/Library/MobileDevice/Provisioning\ Profiles/profile.mobileprovision
```

### 3. Check entitlements

Verify the entitlements in the built app:
```bash
codesign -d --entitlements :- /path/to/built/app.app
```

### 4. Safari extension debugging

Enable Web Inspector for Safari extensions:
1. Enable Developer menu in Safari: `Safari > Preferences > Advanced > Show Develop menu`
2. Connect iOS device and enable Web Inspector: `Settings > Safari > Advanced > Web Inspector`
3. Use Safari's Develop menu to inspect the extension