/**
 * Example usage of the browser-api compatibility layer
 */
import browserAPI from './browser-api';

// Example: Get browser information
async function getBrowserInfo() {
  try {
    const info = await browserAPI.runtime.getBrowserInfo();
    console.log(`Running on ${info.name} ${info.version}`);
    
    // Platform-specific code
    if (browserAPI.type() === 'firefox') {
      console.log('Firefox-specific code here');
    } else if (browserAPI.type() === 'safari') {
      console.log('Safari-specific code here');
    } else {
      console.log('Chrome-specific code here');
    }
  } catch (error) {
    console.error('Error getting browser info:', error);
  }
}

// Example: Store and retrieve data
async function storeAndRetrieveData() {
  try {
    // Store data
    await browserAPI.storage.set({
      userId: 'user123',
      preferences: {
        theme: 'dark',
        notifications: true
      }
    });
    
    // Retrieve data
    const data = await browserAPI.storage.get(['userId', 'preferences']);
    console.log('Retrieved data:', data);
    
    // Remove specific data
    await browserAPI.storage.remove('userId');
    
    // Clear all data
    // await browserAPI.storage.clear();
  } catch (error) {
    console.error('Error with storage:', error);
  }
}

// Example: Working with tabs
async function workWithTabs() {
  try {
    // Query for the current active tab
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    console.log('Current tab:', currentTab);
    
    // Create a new tab
    const newTab = await browserAPI.tabs.create({
      url: 'https://example.com',
      active: true
    });
    console.log('Created new tab:', newTab);
    
    // Update a tab
    const updatedTab = await browserAPI.tabs.update(newTab.id, {
      url: 'https://mozilla.org'
    });
    console.log('Updated tab:', updatedTab);
  } catch (error) {
    console.error('Error working with tabs:', error);
  }
}

// Example: Send a message to the background script
async function sendMessage() {
  try {
    const response = await browserAPI.runtime.sendMessage({
      action: 'getData',
      params: { id: 123 }
    });
    console.log('Response from background:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Example: Get extension URLs
function getExtensionURLs() {
  const popupURL = browserAPI.runtime.getURL('popup.html');
  const settingsURL = browserAPI.runtime.getURL('settings.html');
  console.log('Popup URL:', popupURL);
  console.log('Settings URL:', settingsURL);
}

// Export examples for use in other files
export {
  getBrowserInfo,
  storeAndRetrieveData,
  workWithTabs,
  sendMessage,
  getExtensionURLs
};