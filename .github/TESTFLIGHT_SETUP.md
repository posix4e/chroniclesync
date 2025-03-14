# Setting Up TestFlight Automatic Deployment

This document explains how to set up automatic TestFlight deployments when merging to the main branch.

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. `APPLE_API_KEY_ID` - Your App Store Connect API Key ID
2. `APPLE_API_KEY_ISSUER_ID` - Your App Store Connect API Key Issuer ID
3. `APPLE_API_KEY_CONTENT` - The content of your p8 API key file (base64 encoded)
4. `APPLE_TEAM_ID` - Your Apple Developer Team ID
5. `APPLE_APP_IDENTIFIER` - Your app's bundle identifier (e.g., xyz.chroniclesync.ChronicleSync)

## How to Add GitHub Secrets

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add each of the secrets listed above

## How to Get the Required Values

### App Store Connect API Key

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Go to "Users and Access" > "Keys"
3. Click the "+" button to create a new key
4. Give it a name like "GitHub Actions"
5. Select "App Manager" access
6. Download the API key file (it will be a .p8 file)
7. Note the Key ID and Issuer ID shown on the page

### Base64 Encode the API Key

On macOS/Linux:
```bash
base64 -i AuthKey_KEYID.p8 | pbcopy
```

This will copy the base64-encoded content to your clipboard, which you can paste as the `APPLE_API_KEY_CONTENT` secret.

### Apple Team ID

1. Log in to [Apple Developer Portal](https://developer.apple.com/account)
2. Your Team ID is displayed at the top right, or under "Membership Details"

### App Identifier

This is the bundle identifier of your app, which you set in Xcode (e.g., xyz.chroniclesync.ChronicleSync).

## Workflow Configuration

The workflow is configured to:

1. Trigger when changes are pushed to the main branch that affect the Safari iOS extension
2. Build the Safari extension package
3. Build the iOS app
4. Upload it to TestFlight automatically

## Troubleshooting

If the workflow fails, check:

1. That all secrets are correctly set
2. That the Xcode project builds locally without errors
3. That the App Store Connect API key has sufficient permissions
4. The GitHub Actions logs for specific error messages