// Content script to extract and summarize webpage content

// Function to extract main content from the webpage
function extractPageContent(): string {
  // Try to find the main content
  const mainContent = document.querySelector('main') || 
                      document.querySelector('article') || 
                      document.querySelector('.content') || 
                      document.querySelector('#content');
  
  if (mainContent) {
    return mainContent.textContent?.trim() || '';
  }
  
  // If no main content container is found, extract from body but exclude common non-content elements
  const nonContentSelectors = [
    'header', 'footer', 'nav', '.navigation', '.menu', '.sidebar', 
    '.ads', '.advertisement', '.comments', '.comment-section'
  ];
  
  const bodyClone = document.body.cloneNode(true) as HTMLElement;
  
  // Remove non-content elements from the clone
  nonContentSelectors.forEach(selector => {
    const elements = bodyClone.querySelectorAll(selector);
    elements.forEach(el => el.parentNode?.removeChild(el));
  });
  
  // Get text content from the cleaned body
  return bodyClone.textContent?.trim() || '';
}

// Function to generate a summary of the content
function generateSummary(content: string, maxLength: number = 500): string {
  if (!content) return '';
  
  // Simple summarization: take first few sentences up to maxLength
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let summary = '';
  let currentLength = 0;
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentLength + trimmedSentence.length + 2 <= maxLength) {
      summary += trimmedSentence + '. ';
      currentLength += trimmedSentence.length + 2;
    } else {
      break;
    }
  }
  
  return summary.trim();
}

// Function to handle the page content extraction and summarization
function processPageContent(): void {
  // Wait for the page to be fully loaded
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => setTimeout(processPageContent, 1000));
    return;
  }
  
  // Extract content
  const content = extractPageContent();
  
  // Generate summary
  const summary = generateSummary(content);
  
  // Send content and summary to background script
  chrome.runtime.sendMessage({
    type: 'pageContentExtracted',
    data: {
      url: window.location.href,
      content: content,
      summary: summary
    }
  });
}

// Start processing after a short delay to ensure page is loaded
setTimeout(processPageContent, 1500);

// Also process when the page visibility changes (user returns to the tab)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    processPageContent();
  }
});