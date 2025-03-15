// Content script for Safari extension
// This is adapted from the Chrome/Firefox extension

// Function to extract page metadata
function extractPageMetadata() {
  const metadata = {
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString(),
    content: document.body.innerText.substring(0, 1000), // First 1000 chars of content
    metaTags: {}
  };
  
  // Extract meta tags
  const metaTags = document.querySelectorAll('meta');
  metaTags.forEach(tag => {
    const name = tag.getAttribute('name') || tag.getAttribute('property');
    const content = tag.getAttribute('content');
    if (name && content) {
      metadata.metaTags[name] = content;
    }
  });
  
  return metadata;
}

// Function to send page data to background script
async function sendPageData() {
  try {
    // Get settings from background script
    const settingsResponse = await browser.runtime.sendMessage({
      type: 'GET_SETTINGS'
    });
    
    // Check if sync is disabled
    if (settingsResponse.settings && settingsResponse.settings.syncEnabled === false) {
      // Sync is disabled in settings
      return;
    }
    
    // Extract metadata
    const metadata = extractPageMetadata();
    
    // Send to background script
    await browser.runtime.sendMessage({
      type: 'HISTORY_ITEM',
      data: metadata
    });
    
    // Page data sent successfully
  } catch {
    // Error sending page data
  }
}

// Wait for page to fully load before sending data
window.addEventListener('load', () => {
  // Small delay to ensure page is fully rendered
  setTimeout(sendPageData, 1000);
});

// Listen for messages from popup or background
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_PAGE_DATA') {
    const metadata = extractPageMetadata();
    sendResponse({ success: true, data: metadata });
  }
  return true;
});