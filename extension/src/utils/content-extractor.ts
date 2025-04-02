// Utility to extract and summarize webpage content

interface PageContent {
  content: string;
  summary: string;
}

/**
 * Extract the main content from the current webpage and generate a summary
 * Note: The content is only used for summary generation and is not stored or synced
 * @returns Object containing the extracted content (for summary generation only) and a summary
 */
export function extractPageContent(): PageContent {
  // Extract the main content from the page
  const content = extractMainContent();
  
  // Generate a summary of the content
  const summary = generateSummary(content);
  
  return {
    content, // This is only used for summary generation and will not be stored
    summary
  };
}

/**
 * Extract the main content from the webpage
 * Prioritizes article content, main elements, and readable text
 */
function extractMainContent(): string {
  // Try to find the main content container
  const contentSelectors = [
    'article',
    '[role="main"]',
    'main',
    '.main-content',
    '#content',
    '.content',
    '.post-content',
    '.article-content'
  ];
  
  let mainContent = '';
  
  // Try each selector to find the main content
  for (const selector of contentSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // Use the element with the most text content
      let bestElement = elements[0];
      let maxLength = bestElement.textContent?.length || 0;
      
      for (let i = 1; i < elements.length; i++) {
        const length = elements[i].textContent?.length || 0;
        if (length > maxLength) {
          maxLength = length;
          bestElement = elements[i];
        }
      }
      
      mainContent = bestElement.textContent || '';
      if (mainContent.length > 200) {
        break;
      }
    }
  }
  
  // If no main content found, extract from body
  if (mainContent.length < 200) {
    // Get all paragraphs
    const paragraphs = document.querySelectorAll('p');
    const paragraphTexts: string[] = [];
    
    paragraphs.forEach(p => {
      const text = p.textContent?.trim() || '';
      if (text.length > 20) { // Only include substantial paragraphs
        paragraphTexts.push(text);
      }
    });
    
    mainContent = paragraphTexts.join('\n\n');
  }
  
  // If still no good content, get all text from body
  if (mainContent.length < 200) {
    mainContent = document.body.textContent || '';
  }
  
  // Clean up the content
  return cleanContent(mainContent);
}

/**
 * Clean up extracted content
 */
function cleanContent(content: string): string {
  return content
    .replace(/\\s+/g, ' ')
    .replace(/\\n+/g, '\n')
    .trim();
}

/**
 * Generate a summary of the content
 * Uses a simple algorithm to extract key sentences
 */
function generateSummary(content: string): string {
  if (!content || content.length < 100) {
    return content;
  }
  
  // Split content into sentences
  const sentences = content
    .replace(/([.!?])\\s*(?=[A-Z])/g, '$1|')
    .split('|')
    .filter(s => s.trim().length > 10);
  
  if (sentences.length <= 3) {
    return sentences.join(' ');
  }
  
  // Calculate word frequency
  const wordFrequency: Record<string, number> = {};
  const words = content.toLowerCase().match(/\\b\\w{3,}\\b/g) || [];
  
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Score sentences based on word frequency
  const sentenceScores = sentences.map(sentence => {
    const sentenceWords = sentence.toLowerCase().match(/\\b\\w{3,}\\b/g) || [];
    let score = 0;
    
    sentenceWords.forEach(word => {
      if (wordFrequency[word]) {
        score += wordFrequency[word];
      }
    });
    
    return {
      sentence,
      score: score / Math.max(1, sentenceWords.length)
    };
  });
  
  // Sort sentences by score and take top 3
  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.sentence);
  
  // Return summary
  return topSentences.join(' ');
}