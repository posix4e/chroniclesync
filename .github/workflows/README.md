# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating various tasks in the ChronicleSync project.

## Build Unsigned IPA for Simulator

The `build-unsigned-ipa.yml` workflow builds an unsigned IPA file for iOS simulator testing. This workflow:

1. Builds the ChronicleSync app for the iOS simulator
2. Launches the app in a simulator and takes screenshots
3. Creates an unsigned IPA file
4. Uploads the IPA, app bundle, and screenshots as artifacts

### Artifacts

The workflow produces three artifacts:

1. **ChronicleSync-Simulator**: The unsigned IPA file
2. **ChronicleSync-App-Bundle**: The raw app bundle
3. **ChronicleSync-Screenshots**: Screenshots of the app running in the simulator

### Usage

To use the unsigned IPA in a simulator:

1. Download the IPA artifact from the GitHub Actions run
2. Unzip the IPA to extract the app bundle
3. Use `xcrun simctl install booted /path/to/ChronicleSync.app` to install it in a running simulator

### Limitations

- The unsigned IPA is only for simulator use and cannot be installed on real devices
- The IPA will only work with the simulator architecture it was built for (e.g., x86_64 for Intel Macs, arm64 for Apple Silicon)
- The extension needs to be manually enabled in Settings > Safari > Extensions after installation