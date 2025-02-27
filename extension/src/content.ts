function extractPageContent(): { elements: string[] } {
  const elements: string[] = [];
  
  // Extract text from article elements if they exist
  const articles = document.getElementsByTagName('article');
  if (articles.length > 0) {
    for (const article of articles) {
      elements.push(article.textContent || '');
    }
  }

  // Extract text from main content area
  const mainContent = document.querySelector('main');
  if (mainContent) {
    elements.push(mainContent.textContent || '');
  }

  // Extract text from paragraphs if no article/main content found
  if (elements.length === 0) {
    const paragraphs = document.getElementsByTagName('p');
    for (const p of paragraphs) {
      // Skip very short paragraphs and those in footers/headers
      if ((p.textContent?.length || 0) > 50 && 
          !p.closest('footer') && 
          !p.closest('header') &&
          !p.closest('nav')) {
        elements.push(p.textContent || '');
      }
    }
  }

  // Extract text from divs with substantial content if still no content
  if (elements.length === 0) {
    const divs = document.getElementsByTagName('div');
    for (const div of divs) {
      // Only include divs with substantial content
      if ((div.textContent?.length || 0) > 100 && 
          !div.closest('footer') && 
          !div.closest('header') &&
          !div.closest('nav')) {
        elements.push(div.textContent || '');
      }
    }
  }

  // Clean up the elements
  const cleanElements = elements
    .map(text => text.trim())
    .filter(text => text.length > 0);

  return { elements: cleanElements };
}

// Send the extracted content to the background script
chrome.runtime.sendMessage({
  type: 'pageContent',
  content: extractPageContent()
});