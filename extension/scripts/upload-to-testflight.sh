#!/bin/bash
set -e

# Set variables from environment
API_KEY_CONTENT="$APPLE_API_KEY_CONTENT"
API_KEY_ID="$APPLE_API_KEY_ID"
API_ISSUER_ID="$APPLE_API_KEY_ISSUER_ID"
APP_ID="$APPLE_APP_ID"
IPA_PATH="$1"

# Create a temporary directory for API key
KEY_DIR=$(mktemp -d)
API_KEY_PATH="$KEY_DIR/api_key.p8"

# Decode and save API key
echo "$API_KEY_CONTENT" | base64 --decode > "$API_KEY_PATH"

# Upload to TestFlight using altool
xcrun altool --upload-app --type ios \
  --file "$IPA_PATH" \
  --apiKey "$API_KEY_ID" \
  --apiIssuer "$API_ISSUER_ID" \
  --apple-id "$APP_ID" \
  --verbose

echo "IPA uploaded to TestFlight successfully"