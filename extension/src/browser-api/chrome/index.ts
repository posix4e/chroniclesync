/**
 * Chrome-specific browser API implementation
 */

// Re-export the chrome API directly
export const browserAPI = chrome;

// Add any Chrome-specific implementations here
export const isChrome = true;
export const isFirefox = false;
export const isSafari = false;

// Helper functions for Chrome-specific behavior
export function getExtensionURL(path: string): string {
  return chrome.runtime.getURL(path);
}

// Storage API wrapper (same as the standard Chrome API)
export const storage = chrome.storage;

// Tabs API wrapper
export const tabs = chrome.tabs;

// History API wrapper
export const history = chrome.history;