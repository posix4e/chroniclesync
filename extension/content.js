// Content script that runs on each page
// This is a plain JavaScript file to avoid module issues in content scripts

// Immediately log that the content script has been loaded
console.log('%c ChronicleSync Content Script Loaded', 'background: #4285f4; color: white; padding: 5px; border-radius: 3px; font-weight: bold;');
console.log('ChronicleSync URL:', window.location.href);

// Function to extract main content from a webpage
function extractMainContent(document) {
  console.log('ChronicleSync: Extracting main content...');
  
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
    '[role="main"]',
    '[itemprop="articleBody"]',
    '.story-body',
    '.story-content'
  ];

  let content = '';
  
  // Try each selector
  for (const selector of contentSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`ChronicleSync: Found ${elements.length} elements matching selector "${selector}"`);
      
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
      console.log(`ChronicleSync: Selected best element with ${content.length} characters`);
      break;
    }
  }

  // If no content found with selectors, use paragraphs
  if (!content || content.trim().length < 100) {
    console.log('ChronicleSync: No content found with selectors, trying paragraphs...');
    
    // Get all paragraphs
    const paragraphs = document.querySelectorAll('p');
    console.log(`ChronicleSync: Found ${paragraphs.length} paragraphs`);
    
    // Filter out very short paragraphs (likely navigation or UI elements)
    const significantParagraphs = Array.from(paragraphs).filter(p => {
      const text = p.textContent || '';
      return text.length > 20; // Only paragraphs with more than 20 chars
    });
    
    console.log(`ChronicleSync: Found ${significantParagraphs.length} significant paragraphs`);
    
    content = significantParagraphs
      .map(p => p.textContent)
      .filter(Boolean)
      .join(' ');
    
    // If still no content, use the body text
    if (!content || content.trim().length < 100) {
      console.log('ChronicleSync: No significant paragraphs found, using body text...');
      content = document.body.textContent || '';
    }
  }
  
  // Clean up the content
  content = content.replace(/\s+/g, ' ').trim();
  
  // Remove common boilerplate content
  content = removeBoilerplate(content);
  
  console.log(`ChronicleSync: Extracted ${content.length} characters of content`);
  return content;
}

// Remove common boilerplate content
function removeBoilerplate(text) {
  // List of common phrases to remove
  const boilerplatePatterns = [
    /cookie policy|privacy policy|terms of service|terms of use|all rights reserved/gi,
    /subscribe to our newsletter|sign up for our newsletter/gi,
    /copyright \d{4}|©\s*\d{4}/gi,
    /follow us on|share this|share on/gi,
    /related articles|you might also like|recommended for you/gi
  ];
  
  let cleaned = text;
  
  // Apply each pattern
  for (const pattern of boilerplatePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned;
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
    try {
      console.log('ChronicleSync: Sending content to background script for summarization...');
      
      // Set a timeout to handle the case when the background script doesn't respond
      const timeoutId = setTimeout(() => {
        console.error('%c ChronicleSync: Background script did not respond in time (30s timeout)', 'color: red; font-weight: bold;');
        console.log('ChronicleSync: This may happen if the model is still loading or if there was an error in the background script.');
        console.log('ChronicleSync: Check the background page console for more details (chrome://extensions > ChronicleSync > background page)');
      }, 30000);
      
      chrome.runtime.sendMessage({
        type: 'summarizeContent',
        data: {
          url: window.location.href,
          title: document.title,
          content: content,
          timestamp: Date.now()
        }
      }, response => {
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          console.error('%c ChronicleSync: Error from runtime:', 'color: red; font-weight: bold;', chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.success) {
          console.log('%c ChronicleSync: Summarization completed', 'color: green; font-weight: bold;');
          console.log('%c ChronicleSync Summary:', 'color: green; font-weight: bold;', response.summary);
        } else if (response && response.error) {
          console.error('%c ChronicleSync: Error during summarization:', 'color: red; font-weight: bold;', response.error);
        } else {
          console.warn('%c ChronicleSync: Received unexpected response format', 'color: orange;', response);
        }
      });
    } catch (error) {
      console.error('%c ChronicleSync: Error sending message to background script:', 'color: red; font-weight: bold;', error);
    }
    
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