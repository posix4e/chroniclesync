#!/bin/bash

# Run all three commands in parallel
npm run build & build_pid=$!
npm run lint & lint_pid=$!
npm run test & test_pid=$!

# Wait for all processes to complete
wait $build_pid $lint_pid $test_pid

# Check if all processes completed successfully
if [ $? -eq 0 ]; then
  echo "All processes completed successfully!"
  
  # Build the extension packages
  npm run build:extension
  
  echo "Build, lint, test, and extension packaging completed successfully!"
else
  echo "One or more processes failed!"
  exit 1
fi