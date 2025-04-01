# ChronicleSync Shared Code

This directory contains shared code that is used by both the web extension and iOS Safari extension.

## Directory Structure

- `models/`: Contains shared data models and type definitions
- `api/`: Contains shared API client code
- `utils/`: Contains shared utility functions

## Usage

### Web Extension

For the web extension, this code can be imported directly using TypeScript imports.

### iOS Safari Extension

For the iOS Safari extension, this code needs to be compiled to JavaScript and included in the extension bundle. The iOS app will use Swift adapters to interact with this shared JavaScript code.

## Building

To build the shared code for iOS:

1. Install dependencies:
   ```
   npm install
   ```

2. Build the shared code:
   ```
   npm run build:ios
   ```

This will compile the TypeScript code to JavaScript and place it in the appropriate directory for the iOS extension.

## Development

When making changes to the shared code, make sure to test it with both the web extension and iOS extension to ensure compatibility.