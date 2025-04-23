# iOS Safari Extension Deployment Guide

This document explains how to deploy the ChronicleSync Safari Extension for iOS to the App Store using GitHub Actions.

## GitHub Secrets Configuration

The following GitHub secrets need to be configured in the repository settings:

| Secret Name | Description |
|-------------|-------------|
| `APPLE_TEAM_ID` | Your Apple Developer Team ID (found in the Apple Developer Portal) |
| `APPLE_APP_ID` | The App ID for your iOS app (e.g., `1234567890`) |
| `APPLE_CERTIFICATE_CONTENT` | Base64-encoded content of your Apple Distribution Certificate (.p12 file) |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the Apple Distribution Certificate |
| `APPLE_PROVISIONING_PROFILE` | Base64-encoded content of your Provisioning Profile (.mobileprovision file) |
| `APPLE_API_KEY_ID` | App Store Connect API Key ID |
| `APPLE_API_KEY_ISSUER_ID` | App Store Connect API Key Issuer ID |
| `APPLE_API_KEY_CONTENT` | Base64-encoded content of your App Store Connect API Key (.p8 file) |

## How to Generate Required Files

### Distribution Certificate

1. Go to the Apple Developer Portal > Certificates, Identifiers & Profiles
2. Create a new Distribution Certificate (App Store and Ad Hoc)
3. Download the certificate and import it into Keychain Access
4. Export the certificate as a .p12 file with a password
5. Base64 encode the .p12 file:
   ```bash
   base64 -i Certificates.p12 | pbcopy
   ```
6. Store the output in `APPLE_CERTIFICATE_CONTENT` and the password in `APPLE_CERTIFICATE_PASSWORD`

### Provisioning Profile

1. Go to the Apple Developer Portal > Certificates, Identifiers & Profiles
2. Create a new Provisioning Profile for App Store distribution
3. Download the .mobileprovision file
4. Base64 encode the file:
   ```bash
   base64 -i profile.mobileprovision | pbcopy
   ```
5. Store the output in `APPLE_PROVISIONING_PROFILE`

### App Store Connect API Key

1. Go to App Store Connect > Users and Access > Keys
2. Create a new API Key with App Manager permissions
3. Note the Key ID and Issuer ID
4. Download the .p8 file
5. Base64 encode the file:
   ```bash
   base64 -i AuthKey_XXXXXXXX.p8 | pbcopy
   ```
6. Store the Key ID in `APPLE_API_KEY_ID`, Issuer ID in `APPLE_API_KEY_ISSUER_ID`, and the encoded content in `APPLE_API_KEY_CONTENT`

## Manual Deployment Steps

If you need to deploy manually instead of using GitHub Actions:

1. Open the Xcode project in Xcode
2. Select the appropriate signing team and certificate
3. Archive the app (Product > Archive)
4. In the Organizer window, click "Distribute App"
5. Select "App Store Connect" and follow the prompts
6. Click "Upload" to submit the app to App Store Connect

## Troubleshooting

### Common Issues

1. **Certificate Errors**: Ensure your certificate is valid and not expired
2. **Provisioning Profile Errors**: Make sure the provisioning profile includes the correct App ID and capabilities
3. **API Key Issues**: Verify the API Key has the correct permissions and is not revoked
4. **Build Errors**: Check that all required capabilities are properly configured in Xcode

### Debugging GitHub Actions

1. Check the GitHub Actions logs for detailed error messages
2. For code signing issues, look for errors related to "codesign" or "security"
3. For upload issues, look for errors from "altool" or "App Store Connect API"

## App Store Submission

After the app is uploaded to App Store Connect:

1. Log in to App Store Connect
2. Go to My Apps > ChronicleSync
3. Complete the App Store information (screenshots, description, etc.)
4. Submit for review

## References

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- [GitHub Actions for iOS](https://docs.github.com/en/actions/guides/building-and-testing-swift)