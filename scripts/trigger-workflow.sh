#!/bin/bash

# Script to trigger the CI/CD workflow for specific components
# Usage: ./trigger-workflow.sh [components] [browser] [debug]
# Example: ./trigger-workflow.sh pages,extension chromium true

# Default values
COMPONENTS=${1:-""}
BROWSER=${2:-""}
DEBUG=${3:-false}
API_ENDPOINT=${4:-""}

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first."
    echo "See: https://github.com/cli/cli#installation"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "You are not authenticated with GitHub CLI. Please run 'gh auth login' first."
    exit 1
fi

# Construct the command
COMMAND="gh workflow run ci-cd-combined.yml"

# Add components if specified
if [ -n "$COMPONENTS" ]; then
    COMMAND="$COMMAND -f components=$COMPONENTS"
fi

# Add browser if specified
if [ -n "$BROWSER" ]; then
    COMMAND="$COMMAND -f browser=$BROWSER"
fi

# Add debug if specified
if [ "$DEBUG" = "true" ]; then
    COMMAND="$COMMAND -f debug=true"
fi

# Add API endpoint if specified
if [ -n "$API_ENDPOINT" ]; then
    COMMAND="$COMMAND -f api_endpoint=$API_ENDPOINT"
fi

# Print the command
echo "Running: $COMMAND"

# Execute the command
eval "$COMMAND"

echo "Workflow triggered successfully!"
echo "Check the status at: https://github.com/posix4e/chroniclesync/actions"