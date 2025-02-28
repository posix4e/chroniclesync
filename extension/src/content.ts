// Content script to extract page content for summarization
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'extractContent') {
    try {
      // Extract main content from the page
      const content = extractMainContent();
      sendResponse({ content });
    } catch (error) {
      console.error('Error extracting content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({ error: errorMessage });
    }
    return true;
  }
});

function extractMainContent(): string {
  try {
    // Remove script, style, nav, header, footer elements
    const elementsToRemove = [
      'script', 'style', 'nav', 'header', 'footer', 
      'aside', 'iframe', 'noscript', 'svg', 'form'
    ];
    
    // Create a clone of the document to avoid modifying the original
    const docClone = document.cloneNode(true) as Document;
    
    elementsToRemove.forEach(tag => {
      const elements = docClone.getElementsByTagName(tag);
      for (let i = elements.length - 1; i >= 0; i--) {
        elements[i].parentNode?.removeChild(elements[i]);
      }
    });
    
    // Try to find main content
    let mainContent = '';
    
    // First try to get content from main, article, or section tags
    const contentElements = docClone.querySelectorAll('main, article, .content, .main, #content, #main');
    if (contentElements.length > 0) {
      // Use the largest content element
      let largestElement = contentElements[0];
      let maxLength = largestElement.textContent?.length || 0;
      
      for (let i = 1; i < contentElements.length; i++) {
        const length = contentElements[i].textContent?.length || 0;
        if (length > maxLength) {
          maxLength = length;
          largestElement = contentElements[i];
        }
      }
      
      mainContent = largestElement.textContent || '';
    } else {
      // Fallback to body content
      mainContent = docClone.body.textContent || '';
    }
    
    // Clean the text
    return mainContent
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    console.error('Error extracting main content:', error);
    return document.title;
  }
}