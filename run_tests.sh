#!/bin/bash
set -e

# 1. Run local tests
echo "Running local tests..."
cd pages
npm install
npm run lint
npm test
npm run build:extension

# 2. Create and push branch
cd ..
BRANCH="test-run-$(date +%s)"
git checkout -b $BRANCH
git config user.name "openhands"
git config user.email "openhands@all-hands.dev"

# Update README
sed -i 's/Say "abracadabra" to run the full test suite\./Say "abracadabra" to run the full test suite (running tests via PR #${PR_NUMBER})./g' README.md
git add README.md
git commit -m "Running test suite"
git push origin $BRANCH

# 3. Create PR and monitor CI
PR_DATA=$(curl -s -X POST -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/posix4e/chroniclesync/pulls \
    -d "{\"title\":\"Running test suite\",\"head\":\"$BRANCH\",\"base\":\"main\"}")

PR_NUMBER=$(echo $PR_DATA | jq -r .number)
RUN_ID=""

echo "Created PR #$PR_NUMBER, waiting for CI..."

# Wait for workflow to start
while [ -z "$RUN_ID" ]; do
    sleep 5
    RUN_DATA=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
        "https://api.github.com/repos/posix4e/chroniclesync/actions/runs?branch=$BRANCH")
    RUN_ID=$(echo $RUN_DATA | jq -r '.workflow_runs[0].id')
done

echo "CI started with run ID: $RUN_ID"

# Monitor until complete
while true; do
    JOBS_DATA=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
        "https://api.github.com/repos/posix4e/chroniclesync/actions/runs/$RUN_ID/jobs")
    
    # Pretty print current status
    echo "$JOBS_DATA" | jq -r '.jobs[] | "Job: \(.name) - Status: \(.status) \(.conclusion // "")"'
    
    # Check if all jobs are complete
    INCOMPLETE=$(echo "$JOBS_DATA" | jq -r '.jobs[] | select(.status != "completed") | .id')
    if [ -z "$INCOMPLETE" ]; then
        break
    fi
    
    sleep 10
done

# Get final artifacts
ARTIFACTS=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
    "https://api.github.com/repos/posix4e/chroniclesync/actions/runs/$RUN_ID/artifacts")

echo "Test run complete! Available artifacts:"
echo "$ARTIFACTS" | jq -r '.artifacts[] | "- \(.name) (\(.size_in_bytes) bytes)"'