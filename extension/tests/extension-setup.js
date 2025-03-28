/**
 * Extension-specific test setup
 */
import './setup';

// Additional extension-specific mocks
global.chrome.extension = {
  getURL: jest.fn().mockReturnValue('chrome-extension://mockextensionid/'),
};

// Mock browser APIs specific to extensions
global.browser = {
  runtime: {
    getURL: jest.fn().mockReturnValue('moz-extension://mockextensionid/'),
  },
};