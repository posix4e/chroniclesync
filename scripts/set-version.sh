#!/bin/bash

# Default version if no tag is found
DEFAULT_VERSION="0.1.0"

# Get the latest version tag (excluding beta tags)
LATEST_TAG=$(git tag -l "v*" | sort -V | tail -n1)
VERSION=${LATEST_TAG#v}  # Remove 'v' prefix

if [ -z "$VERSION" ]; then
    echo "No version tag found, using default version: $DEFAULT_VERSION"
    VERSION=$DEFAULT_VERSION
fi

echo "Setting version to $VERSION"

# Update worker package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" worker/package.json

# Update pages package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" pages/package.json

# Update all manifest files
for manifest in pages/src/extension/manifest*.json; do
    sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$manifest"
done

echo "Version updated to $VERSION in all files"