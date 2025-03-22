#!/bin/bash

# Build script for ChronicleSync Safari Extension
# This script builds the Safari extension and creates an unsigned IPA

# Exit on error
set -e

# Set up variables
PROJECT_NAME="ChronicleSync-Safari"
SCHEME_NAME="ChronicleSync-Safari"
BUILD_DIR="build"
ARCHIVE_PATH="${BUILD_DIR}/${PROJECT_NAME}.xcarchive"
IPA_PATH="${BUILD_DIR}/${PROJECT_NAME}.ipa"

# Create build directory if it doesn't exist
mkdir -p "${BUILD_DIR}"

# Clean previous builds
echo "Cleaning previous builds..."
xcodebuild clean -project "${PROJECT_NAME}.xcodeproj" -scheme "${SCHEME_NAME}" || true

# Build the project
echo "Building project..."
xcodebuild build -project "${PROJECT_NAME}.xcodeproj" -scheme "${SCHEME_NAME}" -destination "generic/platform=iOS" CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

# Run tests
echo "Running tests..."
xcodebuild test -project "${PROJECT_NAME}.xcodeproj" -scheme "${SCHEME_NAME}" -destination "platform=iOS Simulator,name=iPhone 14" CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

# Create archive
echo "Creating archive..."
xcodebuild archive -project "${PROJECT_NAME}.xcodeproj" -scheme "${SCHEME_NAME}" -archivePath "${ARCHIVE_PATH}" CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

# Create IPA
echo "Creating IPA..."
mkdir -p "${BUILD_DIR}/Payload"
cp -r "${ARCHIVE_PATH}/Products/Applications/${PROJECT_NAME}.app" "${BUILD_DIR}/Payload/"
(cd "${BUILD_DIR}" && zip -r "${PROJECT_NAME}.ipa" "Payload")

# Clean up
rm -rf "${BUILD_DIR}/Payload"

echo "Build completed successfully!"
echo "Archive: ${ARCHIVE_PATH}"
echo "IPA: ${IPA_PATH}"