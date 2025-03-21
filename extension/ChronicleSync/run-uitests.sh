#!/bin/bash

# This script runs the ChronicleSync Safari extension UI tests

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if the backend server is running
if ! curl -s http://localhost:3000/health > /dev/null; then
  echo "Starting backend server..."
  cd ..
  npm run start-test-server &
  SERVER_PID=$!
  
  # Wait for server to start
  echo "Waiting for server to start..."
  for i in {1..10}; do
    if curl -s http://localhost:3000/health > /dev/null; then
      echo "Server started successfully"
      break
    fi
    
    if [ $i -eq 10 ]; then
      echo "Failed to start server"
      kill $SERVER_PID
      exit 1
    fi
    
    sleep 1
  done
  
  cd - > /dev/null
else
  echo "Backend server is already running"
fi

# Get available simulators
echo "Available iOS simulators:"
xcrun simctl list devices available | grep -i iphone

# Ask for simulator to use
read -p "Enter simulator name (e.g., 'iPhone 14'): " SIMULATOR_NAME

# Run the UI tests
echo "Running UI tests on $SIMULATOR_NAME..."
xcodebuild test \
  -project ChronicleSync.xcodeproj \
  -scheme "ChronicleSync-UITests" \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=$SIMULATOR_NAME" \
  -resultBundlePath TestResults

# Check if tests were successful
if [ $? -eq 0 ]; then
  echo "UI tests completed successfully"
else
  echo "UI tests failed"
fi

# Kill the server if we started it
if [ ! -z "$SERVER_PID" ]; then
  echo "Stopping backend server..."
  kill $SERVER_PID
fi