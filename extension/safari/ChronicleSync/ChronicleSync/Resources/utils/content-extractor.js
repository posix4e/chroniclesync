// Utility functions for extracting content from webpages

// Main function to extract page content
export function extractPageContent() {
  try {
    // Get the main content of the page
    const content = extractMainContent();
    
    // Generate a summary
    const summary = generateSummary(content);
    
    return {
      content,
      summary
    };
  } catch (error) {
    console.error('Error extracting page content:', error);
    return {
      content: '',
      summary: ''
    };
  }
}

// Extract the main content from the page
function extractMainContent() {
  // Try to find the main content element
  const contentSelectors = [
    'article',
    'main',
    '.content',
    '.main-content',
    '#content',
    '#main-content'
  ];
  
  // Try each selector
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim().length > 100) {
      return cleanText(element.textContent);
    }
  }
  
  // If no main content element found, use the body
  const bodyText = document.body.textContent;
  return cleanText(bodyText);
}

// Clean up text content
function cleanText(text) {
  return text
    .replace(/\\s+/g, ' ')
    .replace(/\\n+/g, ' ')
    .trim();
}

// Generate a summary of the content
function generateSummary(content) {
  // Simple summary: first 200 characters
  if (content.length <= 200) {
    return content;
  }
  
  // Find a good breakpoint (end of sentence) within the first 200-250 chars
  const firstPart = content.substring(0, 250);
  const sentenceBreak = firstPart.lastIndexOf('.');
  
  if (sentenceBreak > 150) {
    return content.substring(0, sentenceBreak + 1);
  }
  
  return content.substring(0, 200) + '...';
}