// Content script that runs on each page
import { SummarizationService } from './services/SummarizationService';

// Wait for page to fully load before attempting summarization
window.addEventListener('load', async () => {
  try {
    console.log('ChronicleSync: Page loaded, preparing for summarization...');
    
    // Don't summarize certain types of pages
    if (
      window.location.href.startsWith('chrome://') ||
      window.location.href.startsWith('chrome-extension://') ||
      window.location.href.startsWith('about:') ||
      window.location.href.startsWith('file:')
    ) {
      console.log('ChronicleSync: Skipping summarization for browser internal page');
      return;
    }
    
    // Wait a bit for dynamic content to load
    setTimeout(async () => {
      try {
        // Get the summarization service
        const summarizationService = SummarizationService.getInstance();
        
        // Extract the main content from the page
        const content = summarizationService.extractMainContent(document);
        
        if (!content || content.trim().length < 100) {
          console.log('ChronicleSync: Not enough content to summarize');
          return;
        }
        
        console.log('ChronicleSync: Starting summarization...');
        
        // Initialize the summarizer
        await summarizationService.init();
        
        // Generate the summary
        const summary = await summarizationService.summarize(content);
        
        console.log('ChronicleSync: Summarization completed');
        console.log('ChronicleSync Summary:', summary);
        
        // Store the summary in local storage for this URL
        chrome.runtime.sendMessage({
          type: 'storeSummary',
          data: {
            url: window.location.href,
            title: document.title,
            summary: summary,
            timestamp: Date.now()
          }
        });
        
      } catch (error) {
        console.error('ChronicleSync: Error during summarization:', error);
      }
    }, 2000); // Wait 2 seconds for dynamic content
    
  } catch (error) {
    console.error('ChronicleSync: Error in content script:', error);
  }
});