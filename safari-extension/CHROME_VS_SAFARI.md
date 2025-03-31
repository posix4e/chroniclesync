# Chrome vs. Safari Extensions: Key Differences

When porting a Chrome extension to Safari for iOS, it's important to understand the key differences between the two platforms. This document outlines the main differences and provides guidance on how to address them.

## Manifest Differences

| Feature | Chrome | Safari iOS |
|---------|--------|------------|
| Manifest Version | Supports v3 | Supports v3 with limitations |
| Background | Service workers | Service workers with limitations |
| Permissions | Extensive list | Limited set |
| Host Permissions | Flexible | More restricted |
| Web Accessible Resources | Flexible | Similar to Chrome |
| Options Page | Supported | Supported but with UI differences |

## API Differences

| API | Chrome | Safari iOS |
|-----|--------|------------|
| `chrome.storage` | Full support | Limited support, may need fallbacks |
| `chrome.history` | Full support | Not available |
| `chrome.tabs` | Full support | Limited support |
| `chrome.runtime` | Full support | Limited support |
| `chrome.scripting` | Full support | Limited support |
| `chrome.unlimitedStorage` | Available | Not available |

## Workarounds for Safari iOS Limitations

### Storage API

Safari extensions on iOS have limited storage capabilities. Consider these approaches:

1. Use the `safari-api-adapter.js` to provide fallbacks to `localStorage` when needed
2. For larger storage needs, consider using IndexedDB which is supported in Safari
3. For shared storage between the app and extension, use App Groups with `UserDefaults`

### History API

The History API is not available in Safari extensions on iOS. Alternatives include:

1. Track visited pages within your extension's own storage
2. Implement a custom history tracking system using content scripts
3. Use the native app to provide history functionality

### Background Scripts

Safari on iOS has limitations with background scripts:

1. Background scripts may not run continuously
2. Use event-based approaches rather than continuous polling
3. Consider using the native app for tasks that need to run in the background

### Communication

For communication between different parts of your extension:

1. Use `runtime.sendMessage` and `runtime.onMessage` with the adapter
2. For communication with the native app, use `runtime.sendNativeMessage`
3. Consider using shared storage for simple data sharing

## Testing and Debugging

Testing and debugging Safari extensions on iOS is different from Chrome:

1. Use Safari's Web Inspector for debugging (enable in Settings > Safari > Advanced)
2. Test on both simulator and real devices
3. Be aware that simulator behavior may differ from real devices
4. Use console logging extensively during development

## User Interface Considerations

Safari on iOS has different UI constraints:

1. Popup UI should be designed for touch interaction
2. Consider the smaller screen size of mobile devices
3. Follow iOS design guidelines for a native feel
4. Test your UI on different device sizes

## Performance Considerations

Mobile devices have different performance characteristics:

1. Minimize resource usage, especially in background scripts
2. Reduce network requests to conserve battery
3. Be mindful of memory usage
4. Consider the impact on battery life

## Security and Privacy

Safari on iOS has stricter security and privacy controls:

1. Respect user privacy and data protection
2. Be transparent about data collection
3. Follow Apple's App Store guidelines
4. Consider implementing App Tracking Transparency if collecting user data