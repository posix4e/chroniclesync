#!/bin/bash
# Simple script to watch a GitHub Actions run and download artifacts

# Get the current branch name
BRANCH=$(git branch --show-current)
echo "Branch: $BRANCH"

# Watch the run (this will block until the run completes)
gh run watch

# Get the run ID of the most recent run for this branch
RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId --jq '.[].databaseId')
echo "Run ID: $RUN_ID"

# Check if the run was successful
STATUS=$(gh run view "$RUN_ID" --json conclusion --jq '.conclusion')
echo "Status: $STATUS"

# Download artifacts if the run completed
if [ -n "$RUN_ID" ]; then
    echo "Downloading artifacts..."
    gh run download "$RUN_ID"
fi

# Show the full log if the run failed
if [ "$STATUS" = "failure" ]; then
    echo "Run failed. Showing logs..."
    gh run view "$RUN_ID" --log
fi