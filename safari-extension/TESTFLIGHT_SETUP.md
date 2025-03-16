# Setting Up TestFlight on GitHub Actions

This document explains how to set up TestFlight distribution for the ChronicleSync Safari extension using GitHub Actions.

## Prerequisites

1. An Apple Developer account with access to App Store Connect
2. The app registered in App Store Connect
3. A GitHub repository with GitHub Actions enabled

## Step 1: Create App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com/)
2. Sign in with your Apple ID
3. In the "Security" section, click "Generate Password" under "App-Specific Passwords"
4. Enter a label for the password (e.g., "GitHub Actions")
5. Click "Create" and save the generated password

## Step 2: Create API Key for App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click on "Users and Access" in the sidebar
3. Click on the "Keys" tab
4. Click the "+" button to create a new key
5. Enter a name for the key (e.g., "GitHub Actions")
6. Select the "App Manager" role
7. Click "Generate"
8. Download the API key file (.p8) and note the Key ID and Issuer ID

## Step 3: Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets" > "Actions"
3. Add the following secrets:
   - `APPLE_API_KEY`: The contents of the .p8 file
   - `APPLE_API_KEY_ID`: The Key ID from App Store Connect
   - `APPLE_API_ISSUER_ID`: The Issuer ID from App Store Connect
   - `APPLE_ID`: Your Apple ID email
   - `APPLE_APP_SPECIFIC_PASSWORD`: The app-specific password you generated
   - `APPLE_TEAM_ID`: Your Apple Developer Team ID (found in the Apple Developer portal)

## Step 4: Create a GitHub Actions Workflow for TestFlight

Create a new workflow file in `.github/workflows/testflight.yml`:

```yaml
name: TestFlight Distribution

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-upload:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: extension/package-lock.json

      - name: Install Apple Certificate
        uses: apple-actions/import-codesigning-certs@v2
        with:
          p12-file-base64: ${{ secrets.APPLE_CERTIFICATE_P12 }}
          p12-password: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}

      - name: Install Provisioning Profile
        uses: apple-actions/download-provisioning-profiles@v2
        with:
          bundle-id: 'com.chroniclesync.app'
          profile-type: 'IOS_APP_STORE'
          issuer-id: ${{ secrets.APPLE_API_ISSUER_ID }}
          api-key-id: ${{ secrets.APPLE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPLE_API_KEY }}

      - name: Build Extension
        working-directory: extension
        run: |
          npm ci
          npm run build

      - name: Build Safari Extension
        run: |
          cd safari-extension
          ./build-safari-extension.sh

      - name: Build and Archive
        run: |
          cd safari-extension
          xcodebuild -project ChronicleSync.xcodeproj -scheme "ChronicleSync" -configuration Release -archivePath ChronicleSync.xcarchive archive

      - name: Export IPA
        run: |
          cd safari-extension
          xcodebuild -exportArchive -archivePath ChronicleSync.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath ./build

      - name: Upload to TestFlight
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: safari-extension/build/ChronicleSync.ipa
          issuer-id: ${{ secrets.APPLE_API_ISSUER_ID }}
          api-key-id: ${{ secrets.APPLE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPLE_API_KEY }}
```

## Step 5: Create Export Options File

Create a file at `safari-extension/ExportOptions.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

Replace `YOUR_TEAM_ID` with your actual Apple Developer Team ID.

## Step 6: Generate and Export Certificates

1. Open Keychain Access on your Mac
2. Go to "Certificates" and find your iOS Distribution certificate
3. Right-click on the certificate and select "Export"
4. Save the certificate as a .p12 file and set a password
5. Convert the .p12 file to base64:
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```
6. Add the base64-encoded certificate as a GitHub secret named `APPLE_CERTIFICATE_P12`
7. Add the certificate password as a GitHub secret named `APPLE_CERTIFICATE_PASSWORD`

## Step 7: Test the Workflow

1. Push a commit to the main branch or manually trigger the workflow
2. Monitor the workflow execution in the GitHub Actions tab
3. Once the workflow completes successfully, check App Store Connect to verify the build was uploaded to TestFlight

## Troubleshooting

- If the build fails with code signing errors, verify your certificates and provisioning profiles
- If the upload to TestFlight fails, check the App Store Connect API credentials
- If the build succeeds but doesn't appear in TestFlight, check the App Store Connect processing queue