// Helper functions for testing
console.log('Content script loaded');

window.addEventListener('message', async (event) => {
  console.log('Content script received message:', event.data);
  if (event.source !== window) {
    console.log('Ignoring message from non-window source');
    return;
  }
  
  if (event.data.type === 'GET_HISTORY') {
    console.log('Sending GET_HISTORY message to background script');
    chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (response) => {
      console.log('Got history response from background:', response);
      window.postMessage({ type: 'HISTORY_RESPONSE', data: response }, '*');
    });
  }
  
  if (event.data.type === 'GET_DEVICE_INFO') {
    console.log('Sending GET_DEVICE_INFO message to background script');
    chrome.runtime.sendMessage({ type: 'GET_DEVICE_INFO' }, (response) => {
      console.log('Got device info response from background:', response);
      window.postMessage({ type: 'DEVICE_INFO_RESPONSE', data: response }, '*');
    });
  }
});