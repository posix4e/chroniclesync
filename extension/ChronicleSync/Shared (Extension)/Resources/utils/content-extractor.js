// Extract content from web pages
export function extractPageContent() {
  // Get the main content of the page
  const content = extractMainContent();
  
  // Generate a simple summary
  const summary = generateSummary(content);
  
  return {
    content,
    summary
  };
}

function extractMainContent() {
  // Try to find the main content
  const contentSelectors = [
    'article',
    'main',
    '.content',
    '#content',
    '.article',
    '#article'
  ];
  
  let mainContent = '';
  
  // Try each selector
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      mainContent = element.textContent;
      break;
    }
  }
  
  // If no main content found, use the body
  if (!mainContent) {
    mainContent = document.body.textContent;
  }
  
  // Clean up the content
  return cleanText(mainContent);
}

function cleanText(text) {
  // Remove extra whitespace
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000); // Limit to 10,000 characters
}

function generateSummary(content) {
  // Simple summary: first 200 characters
  return content.substring(0, 200) + (content.length > 200 ? '...' : '');
}

// Function to search content and return matches with context
export function searchContent(content, query) {
  if (!query || !content) return [];
  
  const results = [];
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  let startIndex = 0;
  while (startIndex < lowerContent.length) {
    const foundIndex = lowerContent.indexOf(lowerQuery, startIndex);
    if (foundIndex === -1) break;
    
    // Get context around the match (100 chars before and after)
    const contextStart = Math.max(0, foundIndex - 100);
    const contextEnd = Math.min(content.length, foundIndex + query.length + 100);
    const matchText = content.substring(foundIndex, foundIndex + query.length);
    const context = content.substring(contextStart, contextEnd);
    
    results.push({
      text: matchText,
      context: context
    });
    
    startIndex = foundIndex + query.length;
  }
  
  return results;
}