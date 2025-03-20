#!/bin/bash

# Start the mock iOS app server
echo "Starting mock iOS app server..."
node serve-mock-ios-app.js &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 2

# Run the iOS tests
echo "Running iOS tests..."
npx playwright test ios-app.spec.ts ios-extension-integration.spec.ts ios-main-app.spec.ts

# Kill the server
echo "Stopping mock iOS app server..."
kill $SERVER_PID

echo "Done!"