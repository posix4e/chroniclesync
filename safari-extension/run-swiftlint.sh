#!/bin/bash
set -e

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if SwiftLint is installed
if ! command -v swiftlint &> /dev/null; then
    echo "SwiftLint is not installed. Installing..."
    brew install swiftlint || {
        echo "Failed to install SwiftLint with Homebrew."
        echo "Please install SwiftLint manually: https://github.com/realm/SwiftLint#installation"
        exit 1
    }
fi

# Run SwiftLint
echo "Running SwiftLint..."
cd "$SCRIPT_DIR"
swiftlint

# Check if there are any violations
if [ $? -eq 0 ]; then
    echo "✅ SwiftLint passed with no violations."
else
    echo "⚠️ SwiftLint found violations. Please fix them before committing."
    exit 1
fi