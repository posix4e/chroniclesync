#!/bin/bash
set -e

# Directory setup
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SAFARI_DIR="$ROOT_DIR/safari"
SAFARI_PROJECT_DIR="$SAFARI_DIR/ChronicleSync"
SAFARI_TEST_DIR="$SAFARI_PROJECT_DIR/ChronicleSync Tests"
SCREENSHOTS_DIR="$SAFARI_DIR/Screenshots"

# Ensure screenshots directory exists
mkdir -p "$SCREENSHOTS_DIR"

# Run UI tests for the Safari extension
echo "Running UI tests for Safari extension..."
xcodebuild test \
  -project "$SAFARI_PROJECT_DIR/ChronicleSync.xcodeproj" \
  -scheme "ChronicleSync (iOS)" \
  -destination "platform=iOS Simulator,name=iPhone 14" \
  -resultBundlePath "$SAFARI_DIR/TestResults.xcresult"

# Extract screenshots from test results
echo "Extracting screenshots from test results..."
xcrun xcresulttool get --path "$SAFARI_DIR/TestResults.xcresult" --format json > "$SAFARI_DIR/test_results.json"

# Parse the JSON to find screenshot attachments
SCREENSHOT_PATHS=$(cat "$SAFARI_DIR/test_results.json" | grep -o '"path" : ".*\.png"' | cut -d'"' -f4)

# Copy screenshots to the screenshots directory
for path in $SCREENSHOT_PATHS; do
  cp "$path" "$SCREENSHOTS_DIR/"
done

echo "Safari extension tests completed. Screenshots saved to $SCREENSHOTS_DIR"