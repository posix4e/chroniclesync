# ChronicleSync Cross-Platform Extension Porting Plan

## Overview

This document outlines the plan to port the ChronicleSync Chrome v3 extension to run simultaneously on Firefox and iOS Safari across multiple devices, with e2e tests for each platform.

## Project Structure

```
chroniclesync/
├── shared/                  # Shared code across all platforms
│   ├── api/                 # API client code
│   ├── models/              # Data models
│   ├── utils/               # Utility functions
│   └── storage/             # Storage abstraction
├── platforms/
│   ├── chrome/              # Chrome-specific code
│   ├── firefox/             # Firefox-specific code
│   └── safari-ios/          # Safari iOS-specific code
├── extension/               # Current extension code (to be refactored)
├── e2e/                     # End-to-end tests
│   ├── chrome/              # Chrome-specific tests
│   ├── firefox/             # Firefox-specific tests
│   └── safari-ios/          # Safari iOS-specific tests
└── scripts/
    ├── build-chrome.js      # Chrome build script
    ├── build-firefox.js     # Firefox build script
    ├── build-safari-ios.js  # Safari iOS build script
    └── build-all.js         # Build all platforms
```

## Implementation Plan

### 1. Create Shared Code Base

1. Extract common functionality into the `shared` directory
2. Create platform-agnostic API for storage, browser APIs, etc.
3. Implement adapter pattern for browser-specific APIs

### 2. Firefox Extension

1. Create Firefox-specific manifest.json
2. Implement Firefox-specific adapters for browser APIs
3. Set up build process for Firefox extension

### 3. Safari iOS Extension

1. Create Xcode project for iOS app with Safari extension
2. Implement Safari-specific adapters for extension APIs
3. Set up build process for Safari extension
4. Implement data synchronization between iOS app and extension

### 4. Cross-Platform Synchronization

1. Implement shared backend API client
2. Create consistent data model across platforms
3. Implement synchronization logic

### 5. E2E Testing

1. Set up Playwright tests for Chrome and Firefox
2. Set up XCTest for Safari iOS
3. Create shared test scenarios and data

### 6. CI/CD Pipeline

1. Create GitHub Actions workflows for each platform
2. Set up automated testing for each platform
3. Configure deployment for each platform

## Timeline

1. **Phase 1 (Week 1-2)**: Refactor existing code into shared codebase
2. **Phase 2 (Week 3-4)**: Implement Firefox extension
3. **Phase 3 (Week 5-8)**: Implement Safari iOS extension
4. **Phase 4 (Week 9-10)**: Implement cross-platform synchronization
5. **Phase 5 (Week 11-12)**: Set up e2e testing and CI/CD