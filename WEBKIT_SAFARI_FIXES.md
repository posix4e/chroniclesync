# WebKit/Safari Extension Support Fixes

This PR fixes issues with the GitHub Actions workflow for WebKit/Safari extension testing.

## Changes Made

1. **Separated WebKit/Safari Testing**: 
   - Created a dedicated `playwright-tests-webkit` job that runs on macOS
   - This job specifically downloads the Safari extension artifact
   - Runs only the WebKit tests

2. **Fixed Matrix Strategy for Other Browsers**:
   - Updated the matrix strategy to explicitly define which artifact to download for each browser
   - Removed WebKit from the main matrix to avoid running it on Ubuntu
   - Added proper artifact naming to ensure correct artifacts are downloaded

3. **Updated Dependencies in Check-Failures Job**:
   - Added the new WebKit job to the dependencies list
   - Ensures failures in WebKit tests are properly tracked

## Why These Changes Were Needed

The previous workflow had several issues:
- It tried to run WebKit tests on Ubuntu, which doesn't work well for Safari extensions
- There was a naming mismatch between uploaded artifacts and downloaded artifacts
- The workflow was trying to download a "webkit-extension" artifact, but the uploaded artifact was named "safari-extension"

These changes ensure that:
- WebKit/Safari tests run on macOS, which is the appropriate environment
- The correct artifacts are downloaded for each browser
- The workflow is more robust and less likely to fail due to configuration issues