# Safari IPA Utilities

This directory contains scripts for building, verifying, and testing Safari IPA files.

## Consolidated Script

All Safari IPA generation and testing functionality has been consolidated into a single file:

- `safari-ipa-utils.js` - A consolidated script that contains all the functionality for creating iOS simulators, verifying IPA files, and testing IPAs in simulators.

## Usage

You can use the consolidated script directly with commands:

```bash
# Show help
node safari-ipa-utils.js

# Create an iOS simulator
node safari-ipa-utils.js create-simulator

# Verify an IPA file
node safari-ipa-utils.js verify-ipa [ipa-path]

# Test an IPA in a simulator
node safari-ipa-utils.js test-ipa [simulator-id] [ipa-path]

# Verify and test an IPA file
node safari-ipa-utils.js verify-and-test-ipa <simulator-id> <ipa-path>
```

Or use the npm scripts defined in `package.json`:

```bash
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

- `createIOSSimulator()` - Creates an iOS simulator for testing
- `verifyIpaFile(ipaPath)` - Verifies the generated IPA file
- `testIpaInSimulator(simulatorId, ipaPath)` - Installs and tests the IPA file in a simulator
- `verifyAndTestIpa(simulatorId, ipaPath)` - Verifies and tests an IPA file in a simulator