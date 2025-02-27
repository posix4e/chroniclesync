// Initialize content script
console.log('[ChronicleSync] Content script initializing');

// Function to send page content
function sendPageContent() {
  console.log('[ChronicleSync] Preparing to send page content');
  
  try {
    chrome.runtime.sendMessage({
      type: 'pageContent',
      content: document.documentElement.outerHTML,
      url: window.location.href,
      title: document.title
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('[ChronicleSync] Runtime error:', chrome.runtime.lastError);
        return;
      }
      
      if (response?.error) {
        console.error('[ChronicleSync] Error processing page content:', response.error);
      } else {
        console.log('[ChronicleSync] Page content processed successfully');
      }
    });
  } catch (error) {
    console.error('[ChronicleSync] Error sending page content:', error);
  }
}

// Wait for page to be fully loaded
if (document.readyState === 'complete') {
  sendPageContent();
} else {
  window.addEventListener('load', sendPageContent);
}

console.log('[ChronicleSync] Content script initialized');