#!/bin/bash

# This script adds a UI test target to the ChronicleSync Xcode project

# Navigate to the project directory
cd "$(dirname "$0")"

# Create a temporary file for the project modifications
TEMP_FILE=$(mktemp)

# Extract the project.pbxproj file
PROJECT_FILE="ChronicleSync.xcodeproj/project.pbxproj"

# Add UI Test target to the project
cat > "$TEMP_FILE" << 'EOF'
/* Begin PBXNativeTarget section */
		66C931A22D8C30400012ED3B /* ChronicleSync-UITests */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = 66C931A32D8C30400012ED3B /* Build configuration list for PBXNativeTarget "ChronicleSync-UITests" */;
			buildPhases = (
				66C931A42D8C30400012ED3B /* Sources */,
				66C931A52D8C30400012ED3B /* Frameworks */,
				66C931A62D8C30400012ED3B /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
				66C931A72D8C30400012ED3B /* PBXTargetDependency */,
			);
			name = "ChronicleSync-UITests";
			productName = "ChronicleSync-UITests";
			productReference = 66C931A82D8C30400012ED3B /* ChronicleSync-UITests.xctest */;
			productType = "com.apple.product-type.bundle.ui-testing";
		};
EOF

# Add UI Test target dependency
cat >> "$TEMP_FILE" << 'EOF'
/* Begin PBXTargetDependency section */
		66C931A72D8C30400012ED3B /* PBXTargetDependency */ = {
			isa = PBXTargetDependency;
			target = 66C9313F2D8C303F0012ED3B /* ChronicleSync (iOS) */;
			targetProxy = 66C931A92D8C30400012ED3B /* PBXContainerItemProxy */;
		};
EOF

# Add UI Test target container item proxy
cat >> "$TEMP_FILE" << 'EOF'
/* Begin PBXContainerItemProxy section */
		66C931A92D8C30400012ED3B /* PBXContainerItemProxy */ = {
			isa = PBXContainerItemProxy;
			containerPortal = 66C931242D8C303E0012ED3B /* Project object */;
			proxyType = 1;
			remoteGlobalIDString = 66C9313F2D8C303F0012ED3B;
			remoteInfo = "ChronicleSync (iOS)";
		};
EOF

# Add UI Test target file reference
cat >> "$TEMP_FILE" << 'EOF'
/* Begin PBXFileReference section */
		66C931A82D8C30400012ED3B /* ChronicleSync-UITests.xctest */ = {isa = PBXFileReference; explicitFileType = wrapper.cfbundle; includeInIndex = 0; path = "ChronicleSync-UITests.xctest"; sourceTree = BUILT_PRODUCTS_DIR; };
		66C931AA2D8C30400012ED3B /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };
		66C931AB2D8C30400012ED3B /* TestConfig.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = TestConfig.swift; sourceTree = "<group>"; };
		66C931AC2D8C30400012ED3B /* TestHelpers.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = TestHelpers.swift; sourceTree = "<group>"; };
		66C931AD2D8C30400012ED3B /* ExtensionTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ExtensionTests.swift; sourceTree = "<group>"; };
		66C931AE2D8C30400012ED3B /* HistoryViewTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = HistoryViewTests.swift; sourceTree = "<group>"; };
		66C931AF2D8C30400012ED3B /* SettingsTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = SettingsTests.swift; sourceTree = "<group>"; };
		66C931B02D8C30400012ED3B /* ChronicleSync-UITests.xcconfig */ = {isa = PBXFileReference; lastKnownFileType = text.xcconfig; path = "ChronicleSync-UITests.xcconfig"; sourceTree = "<group>"; };
EOF

# Add UI Test target group
cat >> "$TEMP_FILE" << 'EOF'
/* Begin PBXGroup section */
		66C931B12D8C30400012ED3B /* ChronicleSync-UITests */ = {
			isa = PBXGroup;
			children = (
				66C931AA2D8C30400012ED3B /* Info.plist */,
				66C931AB2D8C30400012ED3B /* TestConfig.swift */,
				66C931AC2D8C30400012ED3B /* TestHelpers.swift */,
				66C931AD2D8C30400012ED3B /* ExtensionTests.swift */,
				66C931AE2D8C30400012ED3B /* HistoryViewTests.swift */,
				66C931AF2D8C30400012ED3B /* SettingsTests.swift */,
				66C931B02D8C30400012ED3B /* ChronicleSync-UITests.xcconfig */,
			);
			path = "ChronicleSync-UITests";
			sourceTree = "<group>";
		};
EOF

# Add UI Test target sources
cat >> "$TEMP_FILE" << 'EOF'
/* Begin PBXSourcesBuildPhase section */
		66C931A42D8C30400012ED3B /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				66C931B22D8C30400012ED3B /* TestConfig.swift in Sources */,
				66C931B32D8C30400012ED3B /* TestHelpers.swift in Sources */,
				66C931B42D8C30400012ED3B /* ExtensionTests.swift in Sources */,
				66C931B52D8C30400012ED3B /* HistoryViewTests.swift in Sources */,
				66C931B62D8C30400012ED3B /* SettingsTests.swift in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
EOF

# Add UI Test target frameworks
cat >> "$TEMP_FILE" << 'EOF'
/* Begin PBXFrameworksBuildPhase section */
		66C931A52D8C30400012ED3B /* Frameworks */ = {
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
EOF

# Add UI Test target resources
cat >> "$TEMP_FILE" << 'EOF'
/* Begin PBXResourcesBuildPhase section */
		66C931A62D8C30400012ED3B /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
EOF

# Add UI Test target build configuration
cat >> "$TEMP_FILE" << 'EOF'
/* Begin XCBuildConfiguration section */
		66C931B72D8C30400012ED3B /* Debug */ = {
			isa = XCBuildConfiguration;
			baseConfigurationReference = 66C931B02D8C30400012ED3B /* ChronicleSync-UITests.xcconfig */;
			buildSettings = {
				BUNDLE_LOADER = "$(TEST_HOST)";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = YES;
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = "com.chroniclesync.ChronicleSync-UITests";
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = NO;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
				TEST_HOST = "$(BUILT_PRODUCTS_DIR)/ChronicleSync.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/ChronicleSync";
				TEST_TARGET_NAME = "ChronicleSync (iOS)";
			};
			name = Debug;
		};
		66C931B82D8C30400012ED3B /* Release */ = {
			isa = XCBuildConfiguration;
			baseConfigurationReference = 66C931B02D8C30400012ED3B /* ChronicleSync-UITests.xcconfig */;
			buildSettings = {
				BUNDLE_LOADER = "$(TEST_HOST)";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = YES;
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = "com.chroniclesync.ChronicleSync-UITests";
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = NO;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
				TEST_HOST = "$(BUILT_PRODUCTS_DIR)/ChronicleSync.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/ChronicleSync";
				TEST_TARGET_NAME = "ChronicleSync (iOS)";
			};
			name = Release;
		};
EOF

# Add UI Test target build configuration list
cat >> "$TEMP_FILE" << 'EOF'
/* Begin XCConfigurationList section */
		66C931A32D8C30400012ED3B /* Build configuration list for PBXNativeTarget "ChronicleSync-UITests" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				66C931B72D8C30400012ED3B /* Debug */,
				66C931B82D8C30400012ED3B /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
EOF

# Update the project file with the UI test target
sed -i -e '/targets = (/a\\t\t\t\t\t\t66C931A22D8C30400012ED3B /* ChronicleSync-UITests */,' "$PROJECT_FILE"
sed -i -e '/Products/a\\t\t\t\t\t\t66C931A82D8C30400012ED3B /* ChronicleSync-UITests.xctest */,' "$PROJECT_FILE"
sed -i -e '/mainGroup = /a\\t\t\t\t\t\t66C931B12D8C30400012ED3B /* ChronicleSync-UITests */,' "$PROJECT_FILE"

# Insert the UI test target definitions from the temp file
sed -i -e '/\/\* Begin PBXNativeTarget section \*\//r '"$TEMP_FILE" "$PROJECT_FILE"

# Clean up
rm "$TEMP_FILE"

echo "UI Test target added to the Xcode project"