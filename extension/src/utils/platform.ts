/**
 * Platform detection and abstraction utilities
 */

export enum BrowserType {
  Chrome = 'chrome',
  Firefox = 'firefox',
  Safari = 'safari',
  Unknown = 'unknown'
}

/**
 * Detects the current browser type
 */
export function detectBrowser(): BrowserType {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    return BrowserType.Chrome;
  } else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.id) {
    return BrowserType.Firefox;
  } else if (typeof safari !== 'undefined' && safari.extension) {
    return BrowserType.Safari;
  }
  return BrowserType.Unknown;
}

/**
 * Returns true if running in a Safari browser
 */
export function isSafari(): boolean {
  return detectBrowser() === BrowserType.Safari;
}

/**
 * Returns true if running in a Chrome browser
 */
export function isChrome(): boolean {
  return detectBrowser() === BrowserType.Chrome;
}

/**
 * Returns true if running in a Firefox browser
 */
export function isFirefox(): boolean {
  return detectBrowser() === BrowserType.Firefox;
}

/**
 * Returns true if running on iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Returns true if running in a Safari extension on iOS
 */
export function isSafariIOS(): boolean {
  return isSafari() && isIOS();
}