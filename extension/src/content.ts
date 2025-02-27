// Send page content to background script
chrome.runtime.sendMessage({
  type: 'pageContent',
  content: document.documentElement.outerHTML,
  url: window.location.href,
  title: document.title
}, response => {
  if (response?.error) {
    console.error('[ChronicleSync] Error processing page content:', response.error);
  } else {
    console.log('[ChronicleSync] Page content processed successfully');
  }
});