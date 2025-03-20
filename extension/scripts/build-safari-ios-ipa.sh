#!/bin/bash
set -e

# Directory where the Xcode project is located
PROJECT_DIR="$(pwd)/safari-ios/ChronicleSync"
PROJECT_NAME="ChronicleSync"
SCHEME_NAME="ChronicleSync"
BUILD_DIR="$(pwd)/build"
ARCHIVE_PATH="${BUILD_DIR}/${PROJECT_NAME}.xcarchive"
IPA_PATH="${BUILD_DIR}/${PROJECT_NAME}.ipa"
SIMULATOR_NAME="iPhone 14"
SCREENSHOT_PATH="${BUILD_DIR}/screenshot.png"

# Create build directory
mkdir -p "${BUILD_DIR}"

echo "Building Safari iOS extension..."

# Build the archive for simulator
xcodebuild archive \
  -project "${PROJECT_DIR}/${PROJECT_NAME}.xcodeproj" \
  -scheme "${SCHEME_NAME}" \
  -configuration Debug \
  -destination "generic/platform=iOS Simulator" \
  -archivePath "${ARCHIVE_PATH}" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="-" \
  SKIP_INSTALL=NO

# Create IPA file
mkdir -p "${ARCHIVE_PATH}/Products/Applications/${PROJECT_NAME}.app/Payload"
cp -r "${ARCHIVE_PATH}/Products/Applications/${PROJECT_NAME}.app" "${ARCHIVE_PATH}/Products/Applications/${PROJECT_NAME}.app/Payload/"
cd "${ARCHIVE_PATH}/Products/Applications/${PROJECT_NAME}.app"
zip -r "${IPA_PATH}" Payload

echo "IPA file created at: ${IPA_PATH}"

# Launch simulator and install the app
echo "Starting iOS simulator..."
xcrun simctl boot "${SIMULATOR_NAME}" || true
sleep 5

echo "Installing app on simulator..."
xcrun simctl install "${SIMULATOR_NAME}" "${ARCHIVE_PATH}/Products/Applications/${PROJECT_NAME}.app"

echo "Launching app on simulator..."
xcrun simctl launch "${SIMULATOR_NAME}" "com.chroniclesync.extension"
sleep 5

echo "Taking screenshot..."
xcrun simctl io "${SIMULATOR_NAME}" screenshot "${SCREENSHOT_PATH}"

echo "Shutting down simulator..."
xcrun simctl shutdown "${SIMULATOR_NAME}"

echo "Safari iOS extension build and test completed successfully."
echo "IPA file: ${IPA_PATH}"
echo "Screenshot: ${SCREENSHOT_PATH}"