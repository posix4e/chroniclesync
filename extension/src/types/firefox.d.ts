/**
 * Type definitions for Firefox browser API
 */

declare namespace browser {
  const runtime: typeof chrome.runtime;
  const tabs: typeof chrome.tabs;
  const storage: typeof chrome.storage;
  const history: typeof chrome.history;
}