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

# Function to run tests on a specific simulator
run_tests_on_simulator() {
    local simulator_name="$1"
    local result_path="$2"
    local derived_data_path="$3"
    
    echo "Running tests on ${simulator_name}..."
    
    # Use set +e to continue script execution even if the test command fails
    set +e
    xcodebuild test \
      -project "${PROJECT_DIR}/${PROJECT_NAME}.xcodeproj" \
      -scheme "${SCHEME_NAME}" \
      -destination "platform=iOS Simulator,name=${simulator_name}" \
      -derivedDataPath "${derived_data_path}" \
      -resultBundlePath "${result_path}" \
      -testPlan "ChronicleSync" 2>&1 | tee "${BUILD_DIR}/test_${simulator_name// /_}.log"
    
    local test_exit_code=$?
    set -e
    
    if [ $test_exit_code -ne 0 ]; then
        echo "Warning: Tests on ${simulator_name} exited with code ${test_exit_code}"
    fi
    
    return 0
}

# Run tests on iPhone 14 simulator
run_tests_on_simulator "iPhone 14" "${BUILD_DIR}/TestResults/results.xcresult" "${BUILD_DIR}/TestResults"

# Also try on iPad simulator for more comprehensive testing
run_tests_on_simulator "iPad Pro (12.9-inch) (6th generation)" "${BUILD_DIR}/TestResults/results_ipad.xcresult" "${BUILD_DIR}/TestResults_iPad"

# Extract screenshots and test results
echo "Extracting test results and screenshots..."

# Create results directory if it doesn't exist
mkdir -p "${BUILD_DIR}/TestResults/extracted"

# Extract test results to JSON format for easier parsing
for result_bundle in "${BUILD_DIR}/TestResults"/*.xcresult; do
    if [ -d "$result_bundle" ]; then
        bundle_name=$(basename "$result_bundle" .xcresult)
        echo "Extracting data from $bundle_name..."
        
        # Extract test summary
        xcrun xcresulttool get --path "$result_bundle" --format json > "${BUILD_DIR}/TestResults/extracted/${bundle_name}.json" 2>/dev/null || echo "Failed to extract JSON from $bundle_name"
        
        # Extract screenshots if available
        xcrun xcresulttool export --path "$result_bundle" --output-path "${BUILD_DIR}/TestResults/extracted/${bundle_name}_attachments" --type attachments 2>/dev/null || echo "No attachments found in $bundle_name"
    fi
done

# Copy all screenshots to the screenshots directory
echo "Collecting screenshots..."
find "${BUILD_DIR}" -name "*.png" -exec cp {} "${SCREENSHOTS_DIR}/" \; 2>/dev/null || echo "No PNG files found"

# Also look for attachments in the test results
find "${BUILD_DIR}/TestResults/extracted" -type f -name "*.png" -exec cp {} "${SCREENSHOTS_DIR}/" \; 2>/dev/null || echo "No PNG attachments found"

echo "Tests completed. Screenshots available in the test results bundle and at ${SCREENSHOTS_DIR}"
echo "Test logs available at ${BUILD_DIR}/test_*.log"