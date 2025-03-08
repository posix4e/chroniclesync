import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractPageContent } from './utils/content-extractor';

// Mock the extractPageContent function
vi.mock('./utils/content-extractor', () => ({
  extractPageContent: vi.fn().mockReturnValue({
    content: 'This is the extracted content with test markers.',
    summary: 'This is the summary.'
  })
}));

// Mock chrome.runtime
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    }
  }
};

// Save original window object
const originalWindow = { ...window };

describe('Content Script', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Mock chrome global
    global.chrome = mockChrome as any;
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/test-page'
      },
      writable: true
    });
    
    // Mock document.title
    Object.defineProperty(document, 'title', {
      value: 'Test Page Title',
      writable: true
    });
  });
  
  it('should extract content and send message on load', async () => {
    // Import the content script to trigger the event listeners
    await import('./content-script');
    
    // Manually trigger the load event
    const loadEvent = new Event('load');
    window.dispatchEvent(loadEvent);
    
    // Wait for the setTimeout in the content script
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Check that extractPageContent was called
    expect(extractPageContent).toHaveBeenCalled();
    
    // Check that sendMessage was called with the correct data
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'pageContentExtracted',
      data: {
        url: 'https://example.com/test-page',
        title: 'Test Page Title',
        content: 'This is the extracted content with test markers.',
        summary: 'This is the summary.',
        timestamp: expect.any(Number)
      }
    });
  });
  
  it('should handle search requests from background script', async () => {
    // Import the content script to set up the message listener
    await import('./content-script');
    
    // Get the message listener callback
    const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    
    // Create a mock sendResponse function
    const sendResponse = vi.fn();
    
    // Create a search request message
    const searchRequest = {
      type: 'searchPageContent',
      query: 'test markers'
    };
    
    // Call the message listener with the search request
    messageListener(searchRequest, {}, sendResponse);
    
    // Check that extractPageContent was called
    expect(extractPageContent).toHaveBeenCalled();
    
    // Check that sendResponse was called with search results
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      results: expect.any(Array)
    });
  });
  
  it('should handle errors during content extraction', async () => {
    // Mock extractPageContent to throw an error
    (extractPageContent as any).mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    // Import the content script to trigger the event listeners
    await import('./content-script');
    
    // Manually trigger the load event
    const loadEvent = new Event('load');
    window.dispatchEvent(loadEvent);
    
    // Wait for the setTimeout in the content script
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Check that sendMessage was not called due to the error
    expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
  
  it('should handle errors during search', async () => {
    // Import the content script to set up the message listener
    await import('./content-script');
    
    // Get the message listener callback
    const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    
    // Create a mock sendResponse function
    const sendResponse = vi.fn();
    
    // Mock extractPageContent to throw an error
    (extractPageContent as any).mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    // Create a search request message
    const searchRequest = {
      type: 'searchPageContent',
      query: 'test markers'
    };
    
    // Call the message listener with the search request
    messageListener(searchRequest, {}, sendResponse);
    
    // Check that sendResponse was called with an error
    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('Test error')
    });
  });
});