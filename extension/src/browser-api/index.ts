/**
 * Browser API abstraction layer
 * 
 * This file serves as a common entry point for browser-specific implementations.
 * The actual implementation is determined at build time based on the target browser.
 */

// Import the browser-specific implementation
// The actual import path is resolved by webpack using the alias '@browser-api'
import {
  browserAPI,
  isChrome,
  isFirefox,
  isSafari,
  getExtensionURL,
  storage,
  tabs,
  history
} from '@browser-api';

// Export the browser-specific implementation
export {
  browserAPI,
  isChrome,
  isFirefox,
  isSafari,
  getExtensionURL,
  storage,
  tabs,
  history
};

// Add any common browser API functions here
export function getBrowserName(): string {
  if (isChrome) return 'Chrome';
  if (isFirefox) return 'Firefox';
  if (isSafari) return 'Safari';
  return 'Unknown';
}