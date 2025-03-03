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
      window.location.href.startsWith('file:') ||
      window.location.href.startsWith('data:')
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
    
    // Send the content to the background script for summarization
    // This is more efficient than loading the model in the content script
    try {
      console.log('ChronicleSync: Sending content to background script for summarization...');
      
      // Set a timeout to handle the case when the background script doesn't respond
      const timeoutId = setTimeout(() => {
        console.error('%c ChronicleSync: Background script did not respond in time (30s timeout)', 'color: red; font-weight: bold;');
        console.log('ChronicleSync: This may happen if the model is still loading or if there was an error in the background script.');
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