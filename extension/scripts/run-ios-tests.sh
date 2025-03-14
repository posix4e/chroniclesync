#!/bin/bash

# Script to run Playwright tests with iOS Safari using Xcode simulator
# This script should be run on macOS with Xcode and Playwright installed

set -e

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo "Error: This script must be run on macOS"
  exit 1
fi

# Check if Xcode is installed
if ! command -v xcrun &> /dev/null; then
  echo "Error: Xcode command line tools not found"
  exit 1
fi

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null; then
  echo "Installing Playwright dependencies..."
  npx playwright install --with-deps webkit
fi

# Get available iOS simulators
echo "Available iOS simulators:"
xcrun simctl list devices available | grep -i iphone

# Ask for simulator to use or use default
read -p "Enter simulator name (or press Enter for iPhone 14): " SIMULATOR_NAME
SIMULATOR_NAME=${SIMULATOR_NAME:-"iPhone 14"}

# Start the iOS simulator
echo "Starting iOS simulator: $SIMULATOR_NAME"
SIMULATOR_UDID=$(xcrun simctl list devices available | grep "$SIMULATOR_NAME" | grep -E -o -i "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})" | head -1)

if [ -z "$SIMULATOR_UDID" ]; then
  echo "Error: Could not find simulator with name: $SIMULATOR_NAME"
  exit 1
fi

echo "Using simulator with UDID: $SIMULATOR_UDID"
xcrun simctl boot "$SIMULATOR_UDID"

# Wait for simulator to boot
echo "Waiting for simulator to boot..."
sleep 5

# Open Safari in the simulator
echo "Opening Safari in the simulator..."
xcrun simctl openurl "$SIMULATOR_UDID" "https://www.example.com"

# Run Playwright tests
echo "Running Playwright tests for iOS Safari..."
BROWSER=ios-safari npx playwright test --project=ios-safari

# Shutdown simulator when done
echo "Tests completed. Shutting down simulator..."
xcrun simctl shutdown "$SIMULATOR_UDID"

echo "iOS Safari tests completed!"