// Safari iOS Extension Content Script

// Function to extract page content
function extractPageContent() {
  const url = window.location.href;
  const title = document.title;
  
  // Get main content (simplified approach)
  const content = document.body.innerText.substring(0, 5000); // Limit to 5000 chars
  
  // Create a simple summary (first 200 chars)
  const summary = content.substring(0, 200).trim() + '...';
  
  // Send data to background script
  browser.runtime.sendMessage({
    type: 'pageContentExtracted',
    data: {
      url,
      title,
      summary
    }
  }).catch(error => {
    console.error('Error sending page content to background script:', error);
  });
}

// Wait for page to fully load before extracting content
window.addEventListener('load', () => {
  // Wait a bit to ensure dynamic content is loaded
  setTimeout(extractPageContent, 2000);
});

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'extractContent') {
    extractPageContent();
    sendResponse({ success: true });
  }
  return true;
});