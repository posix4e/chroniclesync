/**
 * Firefox-specific browser API implementation
 */

// Firefox uses the 'browser' namespace instead of 'chrome'
// @ts-ignore - browser is available in Firefox
export const browserAPI = browser;

// Add any Firefox-specific implementations here
export const isChrome = false;
export const isFirefox = true;
export const isSafari = false;

// Helper functions for Firefox-specific behavior
export function getExtensionURL(path: string): string {
  // @ts-ignore - browser is available in Firefox
  return browser.runtime.getURL(path);
}

// Storage API wrapper
// @ts-ignore - browser is available in Firefox
export const storage = browser.storage;

// Tabs API wrapper
// @ts-ignore - browser is available in Firefox
export const tabs = browser.tabs;

// History API wrapper
// @ts-ignore - browser is available in Firefox
export const history = browser.history;