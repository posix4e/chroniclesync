# Fastlane Setup for ChronicleSync Safari Extension

This directory contains the Fastlane configuration for building and testing the ChronicleSync Safari Extension.

## Prerequisites

- Ruby (version 2.6 or higher)
- Bundler (`gem install bundler`)
- Xcode (latest version recommended)
- Apple Developer account

## Environment Variables

The following environment variables need to be set:

- `APPLE_TEAM_ID`: Your Apple Developer Team ID
- `APPLE_APP_ID`: Your app's bundle identifier (e.g., com.chroniclesync.ChronicleSync)
- `APPLE_ID`: Your Apple ID email
- `MATCH_GIT_URL`: Git URL for your match certificates repository
- `MATCH_PASSWORD`: Password to decrypt the match repository (if using match)
- `FASTLANE_PASSWORD`: Your Apple ID password (or app-specific password)

## Available Lanes

### Setup Signing

```bash
bundle exec fastlane ios setup_signing
```

This lane sets up code signing by syncing certificates and provisioning profiles using match.

### Build

```bash
bundle exec fastlane ios build
```

This lane builds the Safari extension and creates an IPA file.

### Test

```bash
bundle exec fastlane ios test
```

This lane tests the Safari extension in a simulator and takes a screenshot.

## Match Repository Setup

To set up a match repository for certificate management:

1. Create a private Git repository to store your certificates
2. Run the following command to initialize match:

```bash
bundle exec fastlane match init
```

3. Follow the prompts to set up your match repository

## CI/CD Integration

The GitHub Actions workflow is configured to use these Fastlane lanes for building and testing the Safari extension.

## Local Development

For local development, you can use the provided scripts:

- `build-safari-extension.sh`: Builds the Safari extension
- `test-safari-extension.sh`: Tests the Safari extension in a simulator

Both scripts use Fastlane under the hood.