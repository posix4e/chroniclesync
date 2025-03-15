#!/bin/bash
set -e

# Create a temporary directory for certificates
CERT_DIR=$(mktemp -d)
KEYCHAIN_PATH="$CERT_DIR/app-signing.keychain-db"
CERTIFICATE_PATH="$CERT_DIR/certificate.p12"
PROVISIONING_PROFILE_PATH="$CERT_DIR/profile.mobileprovision"
EXPORT_OPTIONS_PATH="$1"

# Set variables from environment
APPLE_TEAM_ID="$APPLE_TEAM_ID"
APPLE_CERTIFICATE_PASSWORD="$APPLE_CERTIFICATE_PASSWORD"

# Create a new keychain
security create-keychain -p "" "$KEYCHAIN_PATH"
security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
security unlock-keychain -p "" "$KEYCHAIN_PATH"

# Add keychain to search list
security list-keychains -d user -s "$KEYCHAIN_PATH" $(security list-keychains -d user | sed s/\"//g)

# Decode and import certificate
echo "$APPLE_CERTIFICATE_CONTENT" | base64 --decode > "$CERTIFICATE_PATH"
security import "$CERTIFICATE_PATH" -P "$APPLE_CERTIFICATE_PASSWORD" -A -t cert -f pkcs12 -k "$KEYCHAIN_PATH"
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" "$KEYCHAIN_PATH"

# Decode and install provisioning profile
echo "$APPLE_PROVISIONING_PROFILE" | base64 --decode > "$PROVISIONING_PROFILE_PATH"
mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
cp "$PROVISIONING_PROFILE_PATH" ~/Library/MobileDevice/Provisioning\ Profiles/

# Get provisioning profile name
PROVISIONING_PROFILE_NAME=$(security cms -D -i "$PROVISIONING_PROFILE_PATH" | plutil -extract Name xml1 -o - - | plutil -p -)
PROVISIONING_PROFILE_NAME=$(echo "$PROVISIONING_PROFILE_NAME" | sed 's/"//g')

# Update export options with team ID and provisioning profile name
sed -i '' "s/TEAM_ID_PLACEHOLDER/$APPLE_TEAM_ID/g" "$EXPORT_OPTIONS_PATH"
sed -i '' "s/PROVISIONING_PROFILE_NAME_PLACEHOLDER/$PROVISIONING_PROFILE_NAME/g" "$EXPORT_OPTIONS_PATH"
sed -i '' "s/PROVISIONING_PROFILE_NAME_EXTENSION_PLACEHOLDER/$PROVISIONING_PROFILE_NAME/g" "$EXPORT_OPTIONS_PATH"

echo "Certificates and provisioning profiles set up successfully"