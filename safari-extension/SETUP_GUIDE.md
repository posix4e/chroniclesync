# iOS Safari Extension Setup Guide for ChronicleSync

This guide provides step-by-step instructions for setting up and configuring the iOS Safari extension for ChronicleSync.

## Prerequisites

Before you begin, ensure you have:
- An Apple Developer account ($99/year)
- Xcode installed on your Mac
- Access to your GitHub repository settings to configure secrets

## Step-by-Step Guide

### Step 1: Create Apple Developer Certificates and Provisioning Profiles

1. **Create a Certificate Signing Request (CSR)**:
   - Open Keychain Access on your Mac
   - Go to Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority
   - Enter your email and name
   - Select "Save to disk" and save the CSR file

2. **Create a Development Certificate**:
   - Log in to [Apple Developer Portal](https://developer.apple.com/account)
   - Go to Certificates, IDs & Profiles > Certificates > + (Add)
   - Select "iOS App Development" and upload your CSR file
   - Download the certificate and double-click to install it in Keychain Access

3. **Register App Identifiers**:
   - In the Apple Developer Portal, go to Identifiers > + (Add)
   - Select "App IDs" and then "App"
   - Enter a description (e.g., "ChronicleSync")
   - Enter a Bundle ID (e.g., "com.yourcompany.chroniclesync")
   - Under Capabilities, enable "Safari Extensions"
   - Click Continue and Register

4. **Create a Provisioning Profile**:
   - In the Apple Developer Portal, go to Profiles > + (Add)
   - Select "iOS App Development"
   - Select your App ID
   - Select your development certificate
   - Select devices (or all devices)
   - Enter a profile name (e.g., "ChronicleSync Development")
   - Download the provisioning profile

### Step 2: Export Certificate for CI/CD

1. **Export Certificate and Private Key**:
   - Open Keychain Access
   - Find your iOS Development certificate
   - Right-click and select "Export"
   - Choose the .p12 format and set a password
   - Save the file

2. **Encode Certificate for GitHub Secrets**:
   - Open Terminal
   - Run: `base64 -i /path/to/your/certificate.p12 | pbcopy`
   - This copies the base64-encoded certificate to your clipboard

3. **Encode Provisioning Profile for GitHub Secrets**:
   - Run: `base64 -i /path/to/your/profile.mobileprovision | pbcopy`
   - This copies the base64-encoded provisioning profile to your clipboard

### Step 3: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository > Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `APPLE_CERTIFICATE_CONTENT`: Paste the base64-encoded certificate
   - `APPLE_CERTIFICATE_PASSWORD`: The password you set for the .p12 file
   - `APPLE_PROVISIONING_PROFILE`: Paste the base64-encoded provisioning profile (must include both app and extension)
   - `APPLE_TEAM_ID`: Your Apple Developer Team ID (found in the Apple Developer Portal)

**Important:** Your provisioning profile must include both the main app bundle ID (`com.chroniclesync.ChronicleSync`) and the extension bundle ID (`com.chroniclesync.ChronicleSync.Extension`). This is typically a wildcard provisioning profile or one specifically configured for both bundle IDs.

### Step 4: Update Xcode Project Configuration

1. Open the Xcode project:
```bash
cd safari-extension
open ChronicleSync.xcodeproj
```

2. Configure signing for both targets:
   - Select the "ChronicleSync" target
   - Go to Signing & Capabilities
   - Set Team to your Apple Developer Team
   - Set Bundle Identifier to match your `APPLE_APP_ID`
   - Repeat for the "ChronicleSync Extension" target

3. Update Info.plist files if needed to ensure bundle identifiers are consistent

### Step 5: Testing Locally

To test your Safari extension locally:

1. Build and run the project in Xcode:
```bash
cd safari-extension
xcodebuild -project ChronicleSync.xcodeproj -scheme "ChronicleSync" -configuration Debug -sdk iphoneos -destination 'platform=iOS Simulator,name=iPhone 15' build
```

2. Or use the provided script:
```bash
cd safari-extension
./test-safari-extension.sh
```

## Troubleshooting

If you encounter issues during setup or building, refer to the [Troubleshooting Guide](./TROUBLESHOOTING.md) for common problems and solutions.