// Content script that runs on each page
// This is a plain JavaScript file to avoid module issues in content scripts

// Immediately log that the content script has been loaded
console.log('%c ChronicleSync Content Script Loaded', 'background: #4285f4; color: white; padding: 5px; border-radius: 3px; font-weight: bold;');
console.log('ChronicleSync URL:', window.location.href);

// Function to extract main content from a webpage
function extractMainContent(document) {
  // Try to find the main content of the page
  // This is a simple heuristic and might need to be improved
  const contentSelectors = [
    'article',
    'main',
    '.content',
    '#content',
    '.post',
    '.article',
    '.entry',
  ];

  let content = '';
  
  // Try each selector
  for (const selector of contentSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // Use the element with the most text
      let bestElement = elements[0];
      let maxLength = bestElement.textContent?.length || 0;
      
      for (let i = 1; i < elements.length; i++) {
        const length = elements[i].textContent?.length || 0;
        if (length > maxLength) {
          maxLength = length;
          bestElement = elements[i];
        }
      }
      
      content = bestElement.textContent || '';
      break;
    }
  }

  // If no content found with selectors, use the body
  if (!content) {
    // Get all paragraphs
    const paragraphs = document.querySelectorAll('p');
    content = Array.from(paragraphs)
      .map(p => p.textContent)
      .filter(Boolean)
      .join(' ');
    
    // If still no content, use the body text
    if (!content) {
      content = document.body.textContent || '';
    }
  }

  return content;
}

// Function to run the summarization
function runSummarization() {
  try {
    console.log('%c ChronicleSync: Page loaded, preparing for summarization...', 'color: #4285f4; font-weight: bold;');
    
    // Don't summarize certain types of pages
    if (
      window.location.href.startsWith('chrome://') ||
      window.location.href.startsWith('chrome-extension://') ||
      window.location.href.startsWith('about:') ||
      window.location.href.startsWith('file:')
    ) {
      console.log('%c ChronicleSync: Skipping summarization for browser internal page', 'color: orange;');
      return;
    }
    
    // Extract the main content from the page
    const content = extractMainContent(document);
    
    if (!content || content.trim().length < 100) {
      console.log('%c ChronicleSync: Not enough content to summarize', 'color: orange;');
      console.log('Content length:', content ? content.trim().length : 0);
      return;
    }
    
    console.log('%c ChronicleSync: Starting summarization...', 'color: #4285f4; font-weight: bold;');
    console.log('Content sample:', content.substring(0, 150) + '...');
    
    // Send the content to the background script for summarization
    chrome.runtime.sendMessage({
      type: 'summarizeContent',
      data: {
        url: window.location.href,
        title: document.title,
        content: content,
        timestamp: Date.now()
      }
    }, response => {
      if (response && response.success) {
        console.log('%c ChronicleSync: Summarization completed', 'color: green; font-weight: bold;');
        console.log('%c ChronicleSync Summary:', 'color: green; font-weight: bold;', response.summary);
      } else if (response && response.error) {
        console.error('%c ChronicleSync: Error during summarization:', 'color: red; font-weight: bold;', response.error);
      }
    });
    
  } catch (error) {
    console.error('%c ChronicleSync: Error extracting content:', 'color: red; font-weight: bold;', error);
  }
}

// Wait for page to fully load before attempting summarization
if (document.readyState === 'complete') {
  console.log('ChronicleSync: Document already complete, running summarization...');
  // Wait a bit for dynamic content to load
  setTimeout(runSummarization, 2000);
} else {
  console.log('ChronicleSync: Waiting for document to load...');
  window.addEventListener('load', () => {
    console.log('ChronicleSync: Document loaded, waiting for dynamic content...');
    // Wait a bit for dynamic content to load
    setTimeout(runSummarization, 2000);
  });
}