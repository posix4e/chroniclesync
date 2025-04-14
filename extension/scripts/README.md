# Safari Tools

This directory contains scripts for building, verifying, and testing Safari IPA files.

## Consolidated Script

All Safari IPA generation and testing functionality has been consolidated into a single file:

- `safari-tools.js` - A comprehensive script that contains all the functionality for building Safari extensions, creating iOS simulators, verifying IPA files, and testing IPAs in simulators.

## Usage

You can use the consolidated script directly with commands:

```bash
# Show help
node safari-tools.js

# Build Safari extension IPA
node safari-tools.js build

# Create an iOS simulator
node safari-tools.js create-simulator

# Verify an IPA file
node safari-tools.js verify-ipa [ipa-path]

# Test an IPA in a simulator
node safari-tools.js test-ipa [simulator-id] [ipa-path]

# Verify and test an IPA file
node safari-tools.js verify-and-test-ipa <simulator-id> <ipa-path>
```

Or use the npm scripts defined in `package.json`:

```bash
# Build Safari extension IPA
npm run build:safari-ipa

# Create an iOS simulator
npm run safari:create-simulator

# Verify an IPA file
npm run safari:verify-ipa

# Test an IPA in a simulator
npm run safari:test-ipa

# Verify and test an IPA
npm run safari:verify-and-test-ipa
```

## Functions

The consolidated script exports the following functions:

- `buildSafariExtension()` - Builds a Safari extension IPA file
- `createIOSSimulator()` - Creates an iOS simulator for testing
- `verifyIpaFile(ipaPath)` - Verifies the generated IPA file
- `testIpaInSimulator(simulatorId, ipaPath)` - Installs and tests the IPA file in a simulator
- `verifyAndTestIpa(simulatorId, ipaPath)` - Verifies and tests an IPA file in a simulator
- `hasAppleSigningSecrets()` - Checks if Apple signing secrets are available in the environment
- `setupAppleSigning()` - Sets up Apple signing environment with the provided secrets

## Apple Signing Support

The script now includes support for properly signing Safari IPA files using Apple certificates and provisioning profiles. This is particularly useful for CI/CD pipelines where you want to generate properly signed IPAs.

### Required Environment Variables

To use the Apple signing functionality, the following environment variables must be set:

- `APPLE_API_KEY_CONTENT` - Base64-encoded content of the Apple API key (.p8 file)
- `APPLE_API_KEY_ID` - Apple API key ID
- `APPLE_API_KEY_ISSUER_ID` - Apple API key issuer ID
- `APPLE_APP_ID` - Apple app ID
- `APPLE_CERTIFICATE_CONTENT` - Base64-encoded content of the Apple certificate (.p12 file)
- `APPLE_CERTIFICATE_PASSWORD` - Password for the Apple certificate
- `APPLE_PROVISIONING_PROFILE` - Base64-encoded content of the Apple provisioning profile (.mobileprovision file)
- `APPLE_TEAM_ID` - Apple team ID

If these environment variables are not set, the script will fall back to creating an unsigned IPA file, which is sufficient for testing purposes but not for distribution.