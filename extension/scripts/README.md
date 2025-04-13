# Safari IPA Utilities

This directory contains scripts for building, verifying, and testing Safari IPA files.

## Consolidated Script

All Safari IPA generation and testing functionality has been consolidated into a single file:

- `safari-ipa-utils.js` - A consolidated script that contains all the functionality for creating iOS simulators, verifying IPA files, and testing IPAs in simulators.

## Symbolic Links

For backward compatibility, the following symbolic links are maintained:

- `create-ios-simulator.js` → `safari-ipa-utils.js`
- `verify-ipa.js` → `safari-ipa-utils.js`
- `test-ipa-in-simulator.js` → `safari-ipa-utils.js`
- `verify-and-test-ipa.js` → `safari-ipa-utils.js`

## Usage

You can use the consolidated script directly:

```bash
# Verify and test an IPA file
node safari-ipa-utils.js <simulator-id> <ipa-path>
```

Or use the npm scripts defined in `package.json`:

```bash
# Create an iOS simulator
npm run create:ios-simulator

# Verify an IPA file
npm run verify:ipa

# Test an IPA in a simulator
npm run test:ipa-in-simulator

# Verify and test an IPA
npm run verify-and-test:ipa

# Use the consolidated script directly
npm run safari:ipa-utils -- <simulator-id> <ipa-path>
```

## Functions

The consolidated script exports the following functions:

- `createIOSSimulator()` - Creates an iOS simulator for testing
- `verifyIpaFile(ipaPath)` - Verifies the generated IPA file
- `testIpaInSimulator(simulatorId, ipaPath)` - Installs and tests the IPA file in a simulator
- `verifyAndTestIpa(simulatorId, ipaPath)` - Verifies and tests an IPA file in a simulator