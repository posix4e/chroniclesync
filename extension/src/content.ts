// Content script that runs on each page
import { SummarizationService } from './services/SummarizationService';

// Immediately log that the content script has been loaded
console.log('%c ChronicleSync Content Script Loaded', 'background: #4285f4; color: white; padding: 5px; border-radius: 3px; font-weight: bold;');
console.log('ChronicleSync URL:', window.location.href);

// Function to run the summarization
async function runSummarization() {
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
    
    // Get the summarization service
    const summarizationService = SummarizationService.getInstance();
    
    // Extract the main content from the page
    const content = summarizationService.extractMainContent(document);
    
    if (!content || content.trim().length < 100) {
      console.log('%c ChronicleSync: Not enough content to summarize', 'color: orange;');
      console.log('Content length:', content ? content.trim().length : 0);
      return;
    }
    
    console.log('%c ChronicleSync: Starting summarization...', 'color: #4285f4; font-weight: bold;');
    console.log('Content sample:', content.substring(0, 150) + '...');
    
    // Initialize the summarizer
    await summarizationService.init();
    
    // Generate the summary
    const summary = await summarizationService.summarize(content);
    
    console.log('%c ChronicleSync: Summarization completed', 'color: green; font-weight: bold;');
    console.log('%c ChronicleSync Summary:', 'color: green; font-weight: bold;', summary);
    
    // Store the summary in local storage for this URL
    chrome.runtime.sendMessage({
      type: 'storeSummary',
      data: {
        url: window.location.href,
        title: document.title,
        summary: summary,
        timestamp: Date.now()
      }
    }, response => {
      if (response && response.success) {
        console.log('ChronicleSync: Summary stored successfully');
      } else if (response && response.error) {
        console.error('ChronicleSync: Error storing summary:', response.error);
      }
    });
    
  } catch (error) {
    console.error('%c ChronicleSync: Error during summarization:', 'color: red; font-weight: bold;', error);
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