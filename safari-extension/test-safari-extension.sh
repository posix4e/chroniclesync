#!/bin/bash

# Exit on error
set -e

# Define paths
SAFARI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCREENSHOTS_DIR="$SAFARI_DIR/screenshots"

# Create screenshots directory
mkdir -p "$SCREENSHOTS_DIR"

# Function to run the simulator and take a screenshot
take_screenshot() {
  local DEVICE_ID=$1
  local SCREENSHOT_NAME=$2
  
  echo "Starting simulator with device ID: $DEVICE_ID"
  xcrun simctl boot "$DEVICE_ID"
  
  echo "Installing app on simulator..."
  xcrun simctl install "$DEVICE_ID" "$SAFARI_DIR/build/ChronicleSync.app"
  
  echo "Launching app..."
  xcrun simctl launch "$DEVICE_ID" "com.chroniclesync.ChronicleSync"
  
  # Wait for app to fully launch
  sleep 5
  
  echo "Taking screenshot..."
  xcrun simctl io "$DEVICE_ID" screenshot "$SCREENSHOTS_DIR/$SCREENSHOT_NAME"
  
  echo "Terminating app..."
  xcrun simctl terminate "$DEVICE_ID" "com.chroniclesync.ChronicleSync"
  
  echo "Shutting down simulator..."
  xcrun simctl shutdown "$DEVICE_ID"
}

# Check if we have a built app
if [ ! -d "$SAFARI_DIR/build/ChronicleSync.app" ]; then
  echo "Error: ChronicleSync.app not found. Please build the app first."
  exit 1
fi

# Get available simulators
echo "Available simulators:"
DEVICE_ID=$(xcrun simctl list devices available | grep "iPhone" | head -1 | sed -E 's/.*\(([A-Za-z0-9-]+)\).*/\1/')

if [ -z "$DEVICE_ID" ]; then
  echo "Error: No available iPhone simulator found."
  exit 1
fi

echo "Using simulator with device ID: $DEVICE_ID"

# Take screenshot
take_screenshot "$DEVICE_ID" "chroniclesync_screenshot.png"

echo "Test completed successfully!"
echo "Screenshot saved to: $SCREENSHOTS_DIR/chroniclesync_screenshot.png"