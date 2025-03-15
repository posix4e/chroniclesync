#!/bin/bash
set -e

# Build script for iOS Safari extension
# This script is designed to be run on macOS with Xcode installed

# Configuration
PROJECT_DIR="ChronicleSync"
PROJECT_NAME="ChronicleSync"
SCHEME_NAME="ChronicleSync"
BUILD_DIR="build"
ARCHIVE_PATH="${BUILD_DIR}/${PROJECT_NAME}.xcarchive"
EXPORT_PATH="${BUILD_DIR}/export"
EXPORT_OPTIONS_PLIST="ExportOptions.plist"

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Create build directory if it doesn't exist
mkdir -p "${BUILD_DIR}"

# Copy web extension resources
echo "Copying web extension resources..."
mkdir -p "${PROJECT_DIR}/${PROJECT_NAME} Extension/Resources"
cp -R ../../extension/dist/* "${PROJECT_DIR}/${PROJECT_NAME} Extension/Resources/"

# Create ExportOptions.plist if it doesn't exist
if [ ! -f "${EXPORT_OPTIONS_PLIST}" ]; then
  cat > "${EXPORT_OPTIONS_PLIST}" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
</dict>
</plist>
EOF
  echo "Created default ${EXPORT_OPTIONS_PLIST}"
fi

# Build the project
echo "Building ${PROJECT_NAME}..."
xcodebuild clean build \
  -project "${PROJECT_DIR}/${PROJECT_NAME}.xcodeproj" \
  -scheme "${SCHEME_NAME}" \
  -configuration Release \
  -derivedDataPath "${BUILD_DIR}/DerivedData" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO

# Archive the project
echo "Archiving ${PROJECT_NAME}..."
xcodebuild archive \
  -project "${PROJECT_DIR}/${PROJECT_NAME}.xcodeproj" \
  -scheme "${SCHEME_NAME}" \
  -configuration Release \
  -archivePath "${ARCHIVE_PATH}" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO

# Export the archive
echo "Exporting ${PROJECT_NAME}..."
xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}" \
  -exportPath "${EXPORT_PATH}" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO

echo "Build completed successfully!"
echo "Output available at: ${EXPORT_PATH}"

# Run tests and capture screenshots
echo "Running tests and capturing screenshots..."

# Create a directory for test screenshots
SCREENSHOTS_DIR="${HOME}/Documents/test-screenshots"
mkdir -p "${SCREENSHOTS_DIR}"

# Run the tests on iPhone 14 simulator
xcodebuild test \
  -project "${PROJECT_DIR}/${PROJECT_NAME}.xcodeproj" \
  -scheme "${SCHEME_NAME}" \
  -destination "platform=iOS Simulator,name=iPhone 14" \
  -derivedDataPath "${BUILD_DIR}/TestResults" \
  -resultBundlePath "${BUILD_DIR}/TestResults/results.xcresult" \
  -testPlan "ChronicleSync" || true

# Also try on iPad simulator for more comprehensive testing
xcodebuild test \
  -project "${PROJECT_DIR}/${PROJECT_NAME}.xcodeproj" \
  -scheme "${SCHEME_NAME}" \
  -destination "platform=iOS Simulator,name=iPad Pro (12.9-inch) (6th generation)" \
  -derivedDataPath "${BUILD_DIR}/TestResults_iPad" \
  -resultBundlePath "${BUILD_DIR}/TestResults/results_ipad.xcresult" \
  -testPlan "ChronicleSync" || true

# Extract screenshots from the test results
xcrun xcresulttool get --path "${BUILD_DIR}/TestResults/results.xcresult" --format json > "${BUILD_DIR}/TestResults/results.json" || true

# Copy any screenshots to the screenshots directory
find "${BUILD_DIR}" -name "*.png" -exec cp {} "${SCREENSHOTS_DIR}/" \; || true

echo "Tests completed. Screenshots available in the test results bundle and at ${SCREENSHOTS_DIR}"