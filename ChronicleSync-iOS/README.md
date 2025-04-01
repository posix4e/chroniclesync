# ChronicleSync iOS Safari Extension

This directory contains the iOS Safari Extension implementation for ChronicleSync.

## Implementation Plan

### 1. Core Components Adaptation

1. **Storage Layer**
   - Create a new storage adapter for iOS that implements the same interface as `HistoryStore.ts`
   - Use `NSUserDefaults` or Core Data for persistent storage
   - Implement the same methods for CRUD operations on history entries

2. **Background Sync**
   - Adapt the background sync logic to work with iOS background fetch
   - Implement a native Swift component for handling sync when the app is in the background

3. **Content Script**
   - Adapt the content script to work with Safari's JavaScript injection mechanism
   - Ensure it can capture the same page content and metadata

### 2. UI Components

1. **Native iOS App UI**
   - Create native Swift UI for the main app
   - Implement settings, history view, and device management screens
   - Use SwiftUI for modern iOS UI development

2. **Extension UI**
   - Implement a simplified extension UI that works within Safari's constraints
   - Focus on essential functionality for the extension part

### 3. Shared Code Strategy

1. **Shared TypeScript/JavaScript**
   - Create a shared core library with TypeScript that can be used by both extensions
   - Include data models, API client logic, and utility functions
   - Compile to JavaScript for use in the Safari extension

2. **Platform-Specific Adapters**
   - Create platform-specific adapters for storage, UI, and browser APIs
   - Use dependency injection to swap implementations based on platform

## Technical Challenges and Solutions

### Storage Limitations

**Challenge**: iOS Safari extensions don't have access to IndexedDB.

**Solution**: 
- Use a combination of `NSUserDefaults`, Core Data, and WebKit's localStorage
- Implement a sync mechanism between the extension and the main app
- Treat local storage as temporary and prioritize syncing with the backend

### Background Sync

**Challenge**: iOS has strict limitations on background processing.

**Solution**:
- Use background fetch capabilities in iOS
- Implement efficient sync that works within iOS constraints
- Use push notifications for triggering sync when possible

### UI Integration

**Challenge**: Safari extensions on iOS have limited UI capabilities.

**Solution**:
- Create a simplified extension UI for essential functions
- Move complex UI to the main app
- Use deep linking between the extension and the main app

## Next Steps

1. Create the Xcode project using the Safari Extension App template
2. Set up the shared code structure
3. Implement the storage adapter for iOS
4. Begin adapting the core functionality