// Function to extract main content from a webpage
function extractMainContent() {
  // Simple heuristic to extract main content
  // This could be improved with more sophisticated content extraction
  const contentElements = [
    ...document.querySelectorAll('article, main, .content, .article, .post'),
    document.body
  ];
  
  // Find the first element with substantial content
  for (const element of contentElements) {
    if (element && element.textContent && element.textContent.trim().length > 200) {
      return element.textContent.trim();
    }
  }
  
  // Fallback to body text
  return document.body.textContent.trim();
}

// Wait for the page to fully load before extracting content
window.addEventListener('load', () => {
  // Give the page a moment to settle
  setTimeout(() => {
    const content = extractMainContent();
    
    // Only send content if it's substantial
    if (content && content.length > 100) {
      chrome.runtime.sendMessage({
        type: 'summarizeContent',
        content: content,
        url: window.location.href,
        title: document.title
      });
    }
  }, 1000);
});