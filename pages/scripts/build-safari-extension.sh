#!/bin/bash
set -e

# Enable debug output
set -x

echo "Starting Safari extension build process..."

# Ensure we're in the pages directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Clean and create build directories
echo "Preparing build directories..."
mkdir -p dist/safari-app
rm -rf dist/safari-app/*

# Verify Safari extension source exists
if [ ! -d "dist/safari" ]; then
    echo "Error: Safari extension source directory not found!"
    echo "Current directory contents:"
    ls -la dist/
    exit 1
fi

# Prepare Safari extension source
echo "Preparing Safari extension source..."
if [ ! -f "dist/safari/manifest.json" ]; then
    echo "Error: manifest.json not found in dist/safari!"
    ls -la dist/safari/
    exit 1
fi

# Ensure all required files are present
required_files=("manifest.json" "background.js" "popup.js" "popup.html")
for file in "${required_files[@]}"; do
    if [ ! -f "dist/safari/$file" ]; then
        echo "Error: Required file $file is missing!"
        exit 1
    fi
done

# Ensure icons directory exists with all required icons
if [ ! -d "dist/safari/icons" ]; then
    echo "Error: icons directory not found!"
    exit 1
fi

for size in 16 48 128; do
    if [ ! -f "dist/safari/icons/icon${size}.png" ]; then
        echo "Error: icon${size}.png is missing!"
        exit 1
    fi
done

echo "Safari extension source files:"
ls -la dist/safari/
echo "Icons:"
ls -la dist/safari/icons/

# Convert web extension to Safari extension
echo "Converting web extension to Safari extension..."
SAFARI_SRC="$(pwd)/dist/safari"
SAFARI_APP="$(pwd)/dist/safari-app"

# Verify manifest version
echo "Verifying manifest version..."
MANIFEST_VERSION=$(jq -r '.manifest_version' "$SAFARI_SRC/manifest.json")
if [ "$MANIFEST_VERSION" != "2" ]; then
    echo "Converting manifest to v2..."
    jq '.manifest_version = 2 | 
        if .action then .browser_action = .action | del(.action) else . end |
        if .background.service_worker then .background.scripts = [.background.service_worker] | del(.background.service_worker) else . end |
        if .host_permissions then .permissions = (.permissions + .host_permissions) | del(.host_permissions) else . end' \
        "$SAFARI_SRC/manifest.json" > "$SAFARI_SRC/manifest.json.tmp" && mv "$SAFARI_SRC/manifest.json.tmp" "$SAFARI_SRC/manifest.json"
fi

echo "Verified manifest version 2:"
jq '.' "$SAFARI_SRC/manifest.json"

echo "Current directory: $(pwd)"
echo "Safari source path: $SAFARI_SRC"
echo "Safari app path: $SAFARI_APP"
echo "Verifying source directory contents:"
ls -la "$SAFARI_SRC"

echo "Manifest content:"
cat "$SAFARI_SRC/manifest.json"

# Check Xcode and developer tools setup
echo "Checking Xcode setup..."
XCODE_PATH=$(xcode-select -p)
echo "Xcode path: $XCODE_PATH"

# List available developer tools
echo "Available developer tools:"
ls -la "$XCODE_PATH/usr/bin/"

# Try to find safari-web-extension-converter in multiple locations
POSSIBLE_PATHS=(
    "$XCODE_PATH/usr/bin/safari-web-extension-converter"
    "/Applications/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter"
    "/Library/Developer/CommandLineTools/usr/bin/safari-web-extension-converter"
)

CONVERTER_PATH=""
for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -x "$path" ]; then
        CONVERTER_PATH="$path"
        break
    fi
done

if [ -z "$CONVERTER_PATH" ]; then
    echo "Error: safari-web-extension-converter not found in any of these locations:"
    printf '%s\n' "${POSSIBLE_PATHS[@]}"
    echo "Trying xcrun as fallback..."
    CONVERTER_PATH=$(xcrun --find safari-web-extension-converter 2>/dev/null || true)
fi

if [ -z "$CONVERTER_PATH" ]; then
    echo "Error: Could not find safari-web-extension-converter"
    echo "Current PATH: $PATH"
    echo "Xcode version:"
    xcodebuild -version
    echo "Available SDKs:"
    xcodebuild -showsdks
    exit 1
fi

echo "Found safari-web-extension-converter at: $CONVERTER_PATH"

# Create a clean temporary directory with just the required files
TEMP_DIR="$(mktemp -d)"
echo "Creating temporary directory for Safari extension: $TEMP_DIR"

# Copy only the required files
echo "Copying files to temporary directory..."
for file in manifest.json background.js popup.html popup.js browser-polyfill.js; do
  echo "Copying $file..."
  if [ ! -f "$SAFARI_SRC/$file" ]; then
    echo "Error: Required file $file not found in $SAFARI_SRC"
    ls -la "$SAFARI_SRC"
    exit 1
  fi
  cp "$SAFARI_SRC/$file" "$TEMP_DIR/"
done

echo "Copying icons..."
mkdir -p "$TEMP_DIR/icons"
if [ ! -d "$SAFARI_SRC/icons" ]; then
  echo "Error: Icons directory not found in $SAFARI_SRC"
  ls -la "$SAFARI_SRC"
  exit 1
fi

for size in 16 48 128; do
  if [ ! -f "$SAFARI_SRC/icons/icon${size}.png" ]; then
    echo "Error: Required icon icon${size}.png not found in $SAFARI_SRC/icons"
    ls -la "$SAFARI_SRC/icons"
    exit 1
  fi
  cp "$SAFARI_SRC/icons/icon${size}.png" "$TEMP_DIR/icons/"
done

# Ensure manifest is v2 for Safari
echo "Verifying and fixing manifest version..."
jq '.manifest_version = 2 | 
    if .action then .browser_action = .action | del(.action) else . end |
    if .background.service_worker then .background.scripts = [.background.service_worker] | del(.background.service_worker) else . end |
    if .host_permissions then .permissions = (.permissions + .host_permissions) | del(.host_permissions) else . end' \
    "$TEMP_DIR/manifest.json" > "$TEMP_DIR/manifest.json.tmp" && mv "$TEMP_DIR/manifest.json.tmp" "$TEMP_DIR/manifest.json"

echo "Final manifest content:"
cat "$TEMP_DIR/manifest.json"

echo "Contents of temporary directory:"
ls -la "$TEMP_DIR"
ls -la "$TEMP_DIR/icons"

echo "Running safari-web-extension-converter..."
echo "Command: \"$CONVERTER_PATH\" \"$TEMP_DIR\" --project-location \"$SAFARI_APP\" --bundle-identifier dev.all-hands.chroniclesync --no-prompt --swift --macos --force"

# Print contents of all files for debugging
echo "Contents of manifest.json:"
cat "$TEMP_DIR/manifest.json"
echo "Contents of background.js:"
cat "$TEMP_DIR/background.js"
echo "Contents of popup.js:"
cat "$TEMP_DIR/popup.js"
echo "Contents of browser-polyfill.js:"
cat "$TEMP_DIR/browser-polyfill.js"

# Cleanup function
cleanup() {
    echo "Cleaning up temporary directory..."
    rm -rf "$TEMP_DIR"
}

# Set up trap to clean up on script exit
trap cleanup EXIT

# Try running the converter directly first
echo "Running converter with direct path..."
if ! "$CONVERTER_PATH" "$TEMP_DIR" \
    --project-location "$SAFARI_APP" \
    --bundle-identifier dev.all-hands.chroniclesync \
    --no-prompt \
    --swift \
    --macos \
    --force \
    --app-name "ChronicleSync" \
    --copy-resources \
    --no-open \
    --no-build \
    --no-configure-xcode \
    --no-install \
    --no-run \
    --platform macos \
    --deployment-target 10.15 \
    --language swift \
    --swift-version 5.0 \
    --development-region en \
    --organization-name "OpenHands" \
    --organization-identifier "dev.all-hands" \
    --product-name "ChronicleSync" \
    --product-version "1.0.0" \
    --product-build-version "1" \
    --product-copyright "Copyright © 2024 OpenHands. All rights reserved." \
    --product-bundle-identifier "dev.all-hands.chroniclesync" \
    --product-team-identifier "" \
    --product-signing-identity "-" \
    --product-signing-certificate "-" \
    --product-provisioning-profile "" \
    --product-provisioning-profile-specifier "" \
    --product-entitlements "" \
    --product-capabilities "" \
    --product-frameworks "" \
    --product-resources "" \
    --product-info-plist "" \
    --product-settings ""; then
    echo "Direct converter execution failed, trying with xcrun..."
    if ! xcrun safari-web-extension-converter "$TEMP_DIR" \
        --project-location "$SAFARI_APP" \
        --bundle-identifier dev.all-hands.chroniclesync \
        --no-prompt \
        --swift \
        --macos \
        --force \
        --app-name "ChronicleSync" \
        --copy-resources \
        --no-open \
        --no-build \
        --no-configure-xcode \
        --no-install \
        --no-run \
        --platform macos \
        --deployment-target 10.15 \
        --language swift \
        --swift-version 5.0 \
        --development-region en \
        --organization-name "OpenHands" \
        --organization-identifier "dev.all-hands" \
        --product-name "ChronicleSync" \
        --product-version "1.0.0" \
        --product-build-version "1" \
        --product-copyright "Copyright © 2024 OpenHands. All rights reserved." \
        --product-bundle-identifier "dev.all-hands.chroniclesync" \
        --product-team-identifier "" \
        --product-signing-identity "-" \
        --product-signing-certificate "-" \
        --product-provisioning-profile "" \
        --product-provisioning-profile-specifier "" \
        --product-entitlements "" \
        --product-capabilities "" \
        --product-frameworks "" \
        --product-resources "" \
        --product-info-plist "" \
        --product-settings ""; then
        echo "Both converter attempts failed. Checking environment:"
        echo "PATH: $PATH"
        echo "XCODE_PATH: $XCODE_PATH"
        echo "CONVERTER_PATH: $CONVERTER_PATH"
        echo "TEMP_DIR contents:"
        ls -la "$TEMP_DIR"
        echo "SAFARI_APP contents:"
        ls -la "$SAFARI_APP"
        echo "Converter version:"
        "$CONVERTER_PATH" --version || true
        echo "Converter help:"
        "$CONVERTER_PATH" --help || true
        echo "Xcode version:"
        xcodebuild -version
        echo "Available SDKs:"
        xcodebuild -showsdks
        echo "Available platforms:"
        xcrun --show-sdk-platform-path --sdk macosx
        exit 1
    fi
fi

# Find the Xcode project
echo "Looking for Xcode project..."
XCODE_PROJECT=$(find dist/safari-app -name "*.xcodeproj" -type d | head -n 1)
if [ -z "$XCODE_PROJECT" ]; then
    echo "Error: No Xcode project found!"
    echo "Contents of dist/safari-app:"
    ls -la dist/safari-app/
    exit 1
fi

# Get project directory and name
PROJECT_DIR=$(dirname "$XCODE_PROJECT")
PROJECT_NAME=$(basename "$PROJECT_DIR")
echo "Found project: $PROJECT_NAME in $PROJECT_DIR"

# Build the project
echo "Building Safari extension..."
cd "$PROJECT_DIR"
echo "Current directory: $(pwd)"
echo "Project name: $PROJECT_NAME"
echo "Project files:"
ls -la

if [ ! -f "$PROJECT_NAME.xcodeproj/project.pbxproj" ]; then
    echo "Error: Project file not found: $PROJECT_NAME.xcodeproj/project.pbxproj"
    echo "Contents of current directory:"
    ls -la
    echo "Contents of .xcodeproj directory:"
    ls -la "$PROJECT_NAME.xcodeproj" || true
    exit 1
fi

echo "Building with xcodebuild..."
echo "Available schemes:"
xcodebuild -list -project "$PROJECT_NAME.xcodeproj" || true

echo "Available SDKs:"
xcodebuild -showsdks || true

echo "Building project..."
# Clean build directory first
echo "Cleaning build directory..."
if ! xcodebuild -project "$PROJECT_NAME.xcodeproj" \
    -scheme "$PROJECT_NAME" \
    -configuration Release \
    clean; then
    echo "Failed to clean project"
    exit 1
fi

# Clean DerivedData directory
echo "Cleaning DerivedData directory..."
rm -rf "$SAFARI_APP/DerivedData"
mkdir -p "$SAFARI_APP/DerivedData"

# Clean other build directories
echo "Cleaning other build directories..."
rm -rf "$SAFARI_APP/build.xcresult"
rm -rf "$SAFARI_APP/SourcePackages"
rm -rf "$SAFARI_APP/ResolvedPackages"

# Create required directories
echo "Creating build directories..."
mkdir -p "$SAFARI_APP/build.xcresult"
mkdir -p "$SAFARI_APP/SourcePackages"
mkdir -p "$SAFARI_APP/ResolvedPackages"

# Set up build environment
echo "Setting up build environment..."
defaults write com.apple.dt.Xcode IDESkipMacroValidation -bool YES
defaults write com.apple.dt.Xcode IDESkipPackagePluginFingerprintValidation -bool YES
defaults write com.apple.dt.Xcode IDEDerivedDataLocationStyle -string "Workspace"
defaults write com.apple.dt.Xcode IDECustomDerivedDataLocation -string "$SAFARI_APP/DerivedData"

# Set up code signing
echo "Setting up code signing..."

# Function to clean up keychain
cleanup_keychain() {
    echo "Cleaning up keychain..."
    security delete-keychain build.keychain 2>/dev/null || true
}

# Function to handle errors
handle_error() {
    local message="$1"
    echo "Error: $message"
    cleanup_keychain
    exit 1
}

# Clean up any existing keychain
cleanup_keychain

# Create new keychain
echo "Creating new keychain..."
if ! security create-keychain -p "" build.keychain; then
    handle_error "Failed to create keychain"
fi

# Set as default keychain
echo "Setting as default keychain..."
if ! security default-keychain -s build.keychain; then
    handle_error "Failed to set default keychain"
fi

# Unlock keychain
echo "Unlocking keychain..."
if ! security unlock-keychain -p "" build.keychain; then
    handle_error "Failed to unlock keychain"
fi

# Set keychain settings
echo "Setting keychain settings..."
if ! security set-keychain-settings -t 3600 -l build.keychain; then
    handle_error "Failed to set keychain settings"
fi

# Set up trap to clean up keychain on script exit
trap cleanup_keychain EXIT

# Create temporary directory for certificate files
CERT_DIR="$(mktemp -d)"
echo "Creating certificate files in: $CERT_DIR"

# Create self-signed certificate
echo "Creating certificate signing request..."
openssl req -new -newkey rsa:2048 -nodes \
    -keyout "$CERT_DIR/cert.key" \
    -out "$CERT_DIR/cert.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=OpenHands/CN=ChronicleSync"

if [ $? -ne 0 ]; then
    echo "Failed to create certificate signing request"
    security delete-keychain build.keychain || true
    rm -rf "$CERT_DIR"
    exit 1
fi

# Create self-signed certificate
echo "Creating self-signed certificate..."
openssl x509 -req -days 365 \
    -in "$CERT_DIR/cert.csr" \
    -signkey "$CERT_DIR/cert.key" \
    -out "$CERT_DIR/cert.cer" \
    -extensions v3_req \
    -extfile <(cat << EOF
[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = codeSigning
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
EOF
)

if [ $? -ne 0 ]; then
    echo "Failed to create certificate"
    security delete-keychain build.keychain || true
    rm -rf "$CERT_DIR"
    exit 1
fi

# Create PKCS#12 file
echo "Creating PKCS#12 file..."
openssl pkcs12 -export \
    -in "$CERT_DIR/cert.cer" \
    -inkey "$CERT_DIR/cert.key" \
    -out "$CERT_DIR/cert.p12" \
    -name "ChronicleSync" \
    -passout pass:""

if [ $? -ne 0 ]; then
    echo "Failed to create PKCS#12 file"
    security delete-keychain build.keychain || true
    rm -rf "$CERT_DIR"
    exit 1
fi

# Import certificate
echo "Importing certificate..."
if ! security import "$CERT_DIR/cert.p12" \
    -k build.keychain \
    -P "" \
    -T /usr/bin/codesign \
    -f pkcs12; then
    echo "Failed to import certificate"
    security delete-keychain build.keychain || true
    rm -rf "$CERT_DIR"
    exit 1
fi

# Clean up certificate files
rm -rf "$CERT_DIR"

# List certificates
echo "Available certificates:"
security find-identity -v -p codesigning build.keychain

# Set partition list
echo "Setting partition list..."
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" build.keychain

# Add to keychain search list
echo "Adding to keychain search list..."
security list-keychains -d user -s build.keychain $(security list-keychains -d user | xargs)

# Build the project
echo "Starting build..."
if ! xcodebuild -project "$PROJECT_NAME.xcodeproj" \
    -scheme "$PROJECT_NAME" \
    -configuration Release \
    -sdk macosx \
    -verbose \
    -allowProvisioningUpdates \
    -allowProvisioningDeviceRegistration \
    -destination 'platform=macOS' \
    -derivedDataPath "$SAFARI_APP/DerivedData" \
    -IDECustomDerivedDataLocation="$SAFARI_APP/DerivedData" \
    -resultBundlePath "$SAFARI_APP/build.xcresult" \
    -clonedSourcePackagesDirPath "$SAFARI_APP/SourcePackages" \
    -resolvedPackagesDirPath "$SAFARI_APP/ResolvedPackages" \
    MACOSX_DEPLOYMENT_TARGET=10.15 \
    CODE_SIGN_IDENTITY="-" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO \
    DEVELOPMENT_TEAM="" \
    PROVISIONING_PROFILE="" \
    PROVISIONING_PROFILE_SPECIFIER="" \
    ENABLE_HARDENED_RUNTIME=NO \
    ENABLE_APP_SANDBOX=NO \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=NO \
    STRIP_INSTALLED_PRODUCT=NO \
    COPY_PHASE_STRIP=NO \
    DEBUG_INFORMATION_FORMAT=dwarf-with-dsym \
    GCC_OPTIMIZATION_LEVEL=0 \
    ONLY_ACTIVE_ARCH=YES \
    ARCHS="x86_64" \
    VALID_ARCHS="x86_64" \
    EXCLUDED_ARCHS="arm64" \
    CLANG_ENABLE_MODULES=YES \
    SWIFT_VERSION=5.0 \
    SWIFT_OPTIMIZATION_LEVEL="-Onone" \
    SWIFT_COMPILATION_MODE=singlefile \
    SWIFT_TREAT_WARNINGS_AS_ERRORS=NO \
    SWIFT_SUPPRESS_WARNINGS=YES \
    SWIFT_ACTIVE_COMPILATION_CONDITIONS="DEBUG" \
    SWIFT_ENFORCE_EXCLUSIVE_ACCESS=off \
    SWIFT_INSTALL_OBJC_HEADER=NO \
    SWIFT_OBJC_BRIDGING_HEADER="" \
    SWIFT_PRECOMPILE_BRIDGING_HEADER=NO \
    SWIFT_REFLECTION_METADATA_LEVEL=none \
    SWIFT_WHOLE_MODULE_OPTIMIZATION=NO \
    CLANG_ENABLE_OBJC_ARC=YES \
    CLANG_ENABLE_OBJC_WEAK=YES \
    CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING=YES \
    CLANG_WARN_BOOL_CONVERSION=YES \
    CLANG_WARN_COMMA=YES \
    CLANG_WARN_CONSTANT_CONVERSION=YES \
    CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS=YES \
    CLANG_WARN_DIRECT_OBJC_ISA_USAGE=YES_ERROR \
    CLANG_WARN_DOCUMENTATION_COMMENTS=YES \
    CLANG_WARN_EMPTY_BODY=YES \
    CLANG_WARN_ENUM_CONVERSION=YES \
    CLANG_WARN_INFINITE_RECURSION=YES \
    CLANG_WARN_INT_CONVERSION=YES \
    CLANG_WARN_NON_LITERAL_NULL_CONVERSION=YES \
    CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF=YES \
    CLANG_WARN_OBJC_LITERAL_CONVERSION=YES \
    CLANG_WARN_OBJC_ROOT_CLASS=YES_ERROR \
    CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER=YES \
    CLANG_WARN_RANGE_LOOP_ANALYSIS=YES \
    CLANG_WARN_STRICT_PROTOTYPES=YES \
    CLANG_WARN_SUSPICIOUS_MOVE=YES \
    CLANG_WARN_UNGUARDED_AVAILABILITY=YES_AGGRESSIVE \
    CLANG_WARN_UNREACHABLE_CODE=YES \
    CLANG_WARN__DUPLICATE_METHOD_MATCH=YES \
    GCC_C_LANGUAGE_STANDARD=gnu11 \
    GCC_NO_COMMON_BLOCKS=YES \
    GCC_WARN_64_TO_32_BIT_CONVERSION=YES \
    GCC_WARN_ABOUT_RETURN_TYPE=YES_ERROR \
    GCC_WARN_UNDECLARED_SELECTOR=YES \
    GCC_WARN_UNINITIALIZED_AUTOS=YES_AGGRESSIVE \
    GCC_WARN_UNUSED_FUNCTION=YES \
    GCC_WARN_UNUSED_VARIABLE=YES \
    ENABLE_STRICT_OBJC_MSGSEND=YES \
    ENABLE_TESTABILITY=YES \
    MTL_ENABLE_DEBUG_INFO=YES \
    MTL_FAST_MATH=YES; then
    echo "xcodebuild failed. Checking build directory:"
    ls -la build/Release || true
    echo "Checking available schemes:"
    xcodebuild -list -project "$PROJECT_NAME.xcodeproj" || true
    echo "Checking build logs:"
    find ~/Library/Developer/Xcode/DerivedData -name "*.log" -type f -exec tail -n 100 {} \;
    echo "Checking project settings:"
    xcodebuild -project "$PROJECT_NAME.xcodeproj" -showBuildSettings || true
    exit 1
fi

# Find and package the app
echo "Looking for built app..."
APP_PATH=$(find . -name "*.app" -type d | head -n 1)
if [ -z "$APP_PATH" ]; then
    echo "Error: Built app not found!"
    echo "Contents of build directory:"
    find . -type d
    echo "Contents of Release directory:"
    ls -la build/Release || true
    echo "Contents of Debug directory:"
    ls -la build/Debug || true
    exit 1
fi

echo "Found app at: $APP_PATH"
echo "App contents:"
ls -la "$APP_PATH"

echo "Creating zip archive..."
cd ..
FULL_APP_PATH="$PROJECT_NAME/build/Release/$PROJECT_NAME.app"
if [ ! -d "$FULL_APP_PATH" ]; then
    echo "Error: App not found at expected path: $FULL_APP_PATH"
    echo "Available paths:"
    find "$PROJECT_NAME/build" -type d
    exit 1
fi

echo "Creating zip archive from: $FULL_APP_PATH"
# First, ensure all files have correct permissions
echo "Setting file permissions..."
find "$FULL_APP_PATH" -type f -exec chmod 644 {} \;
find "$FULL_APP_PATH" -type d -exec chmod 755 {} \;
find "$FULL_APP_PATH/Contents/MacOS" -type f -exec chmod 755 {} \;

# Create a clean temporary directory for packaging
PACKAGE_DIR="$(mktemp -d)"
echo "Creating temporary package directory: $PACKAGE_DIR"

# Copy app to temporary directory with ditto to preserve attributes
echo "Copying app to temporary directory..."
if ! ditto "$FULL_APP_PATH" "$PACKAGE_DIR/$(basename "$FULL_APP_PATH")"; then
    echo "Error: Failed to copy app to temporary directory"
    exit 1
fi

# Create zip archive
echo "Creating zip archive..."
if ! ditto -c -k --sequesterRsrc --keepParent "$PACKAGE_DIR/$(basename "$FULL_APP_PATH")" ../chroniclesync-safari.zip; then
    echo "Error: Failed to create zip archive with ditto"
    echo "Checking ditto command:"
    which ditto
    echo "Checking source directory:"
    ls -la "$PACKAGE_DIR"
    echo "Checking target directory:"
    ls -la ..
    echo "Checking app contents:"
    find "$PACKAGE_DIR" -type f -ls
    echo "Checking app permissions:"
    ls -la "$PACKAGE_DIR/$(basename "$FULL_APP_PATH")/Contents/MacOS/"* || true
    echo "Trying zip command as fallback..."
    cd "$PACKAGE_DIR"
    if ! zip -r ../../chroniclesync-safari.zip "$(basename "$FULL_APP_PATH")"; then
        echo "Error: Both ditto and zip failed"
        echo "Checking zip command:"
        which zip
        echo "Checking disk space:"
        df -h .
        echo "Checking file limits:"
        ulimit -a
        cd -
        rm -rf "$PACKAGE_DIR"
        exit 1
    fi
    cd -
fi

# Clean up
echo "Cleaning up temporary directory..."
rm -rf "$PACKAGE_DIR"

echo "Safari extension build complete!"
ls -la ../chroniclesync-safari.zip