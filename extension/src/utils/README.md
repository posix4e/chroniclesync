# Browser API Abstraction Layer

This directory contains utilities for cross-platform browser extension development, supporting Chrome, Firefox, and Safari (including iOS).

## Files

- `platform.ts` - Platform detection utilities
- `browser-api.ts` - Browser API abstraction layer

## Platform Detection

The `platform.ts` file provides utilities to detect the current browser environment:

```typescript
import { detectBrowser, BrowserType, isSafari, isChrome, isFirefox, isIOS } from './platform';

// Check the browser type
const browserType = detectBrowser();
if (browserType === BrowserType.Safari) {
  // Safari-specific code
}

// Or use convenience functions
if (isSafari()) {
  // Safari-specific code
}

if (isIOS()) {
  // iOS-specific code
}
```

## Browser API Abstraction

The `browser-api.ts` file provides a unified interface for browser extension APIs:

```typescript
import { browserAPI } from './browser-api';

// Storage API
await browserAPI.storage.get('myKey');
await browserAPI.storage.set({ myKey: 'myValue' });

// Tabs API
const activeTab = await browserAPI.tabs.getActive();
await browserAPI.tabs.create({ url: 'https://example.com' });

// Runtime API
await browserAPI.runtime.sendMessage({ action: 'doSomething' });
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message
});
```

## Usage Guidelines

1. Always use the abstraction layer instead of direct browser APIs
2. For platform-specific features, use platform detection:

```typescript
import { isSafari } from './platform';
import { browserAPI } from './browser-api';

async function getHistory() {
  if (isSafari()) {
    // Safari doesn't support history API, use alternative
    return await fetchHistoryFromServer();
  } else {
    // Use Chrome/Firefox history API
    return await browserAPI.history.search({ text: '', maxResults: 100 });
  }
}
```

3. When adding new browser APIs, extend the abstraction layer rather than using platform-specific code in components