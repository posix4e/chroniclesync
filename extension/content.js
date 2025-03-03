// Wait for page to be fully loaded before attempting summarization
if (document.readyState === 'complete') {
  initializeSummarization();
} else {
  window.addEventListener('load', initializeSummarization);
}

function initializeSummarization() {
  // Skip summarization for browser internal pages
  const url = window.location.href;
  if (url.startsWith('chrome://') || 
      url.startsWith('chrome-extension://') || 
      url.startsWith('about:') ||
      url.startsWith('edge://') ||
      url.startsWith('brave://')) {
    return;
  }

  // Wait a bit for dynamic content to load
  setTimeout(() => {
    // Extract main content from the page
    const content = extractMainContent();
    
    if (content && content.length > 200) {
      // Send content to background script for summarization
      chrome.runtime.sendMessage({
        type: 'summarizePage',
        data: {
          url: window.location.href,
          title: document.title,
          content: content
        }
      });
    }
  }, 2000);
}

// Extract main content from a webpage
function extractMainContent() {
  // Try to find the main content using common selectors
  const selectors = [
    'article',
    'main',
    '.article',
    '.post',
    '.content',
    '#content',
    '.main-content',
    '[role="main"]'
  ];

  let content = '';
  
  // Try each selector until we find content
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // Use the first matching element with the most text content
      let bestElement = elements[0];
      let maxLength = bestElement.textContent ? bestElement.textContent.length : 0;
      
      for (let i = 1; i < elements.length; i++) {
        const length = elements[i].textContent ? elements[i].textContent.length : 0;
        if (length > maxLength) {
          maxLength = length;
          bestElement = elements[i];
        }
      }
      
      content = bestElement.textContent || '';
      if (content.length > 500) {
        break; // Found substantial content
      }
    }
  }

  // If no content found with selectors, extract paragraphs
  if (content.length < 500) {
    const paragraphs = document.querySelectorAll('p');
    if (paragraphs.length > 0) {
      content = Array.from(paragraphs)
        .map(p => p.textContent || '')
        .filter(text => text.length > 100) // Filter out short paragraphs
        .join('\n\n');
    }
  }

  // Clean the content
  return cleanContent(content);
}

// Clean extracted content
function cleanContent(content) {
  if (!content) return '';
  
  // Remove extra whitespace
  let cleaned = content.replace(/\s+/g, ' ');
  
  // Remove common boilerplate text
  const boilerplatePatterns = [
    /cookie policy/gi,
    /privacy policy/gi,
    /terms of service/gi,
    /accept cookies/gi,
    /all rights reserved/gi,
    /copyright \d{4}/gi
  ];
  
  for (const pattern of boilerplatePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned.trim();
}