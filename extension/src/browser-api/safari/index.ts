/**
 * Safari-specific browser API implementation
 */

// Safari uses the 'browser' namespace in the WebExtension API
// @ts-ignore - browser is available in Safari WebExtension
export const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Add any Safari-specific implementations here
export const isChrome = false;
export const isFirefox = false;
export const isSafari = true;

// Helper functions for Safari-specific behavior
export function getExtensionURL(path: string): string {
  // Safari WebExtension API uses the same method as Chrome
  return browserAPI.runtime.getURL(path);
}

// Storage API wrapper
export const storage = browserAPI.storage;

// Tabs API wrapper
export const tabs = browserAPI.tabs;

// History API wrapper
export const history = browserAPI.history;