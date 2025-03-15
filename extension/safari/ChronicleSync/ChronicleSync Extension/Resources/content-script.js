// This is the content script for the Safari extension
// It will be adapted from the Chrome/Firefox content script

// Function to send page visit to background script
function sendPageVisit() {
  const url = window.location.href;
  const title = document.title;
  const timestamp = new Date().toISOString();
  
  browser.runtime.sendMessage({
    type: 'PAGE_VISIT',
    url,
    title,
    timestamp
  }).then(() => {
    // Message sent successfully
  }).catch(() => {
    // Handle error silently
  });
}

// Send page visit when the page is loaded
window.addEventListener('load', () => {
  // Wait a moment to ensure the page is fully loaded
  setTimeout(sendPageVisit, 1000);
});

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_INFO') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      content: document.body.innerText.substring(0, 1000) // First 1000 chars
    });
  }
  
  return true; // Keep the message channel open for async response
});