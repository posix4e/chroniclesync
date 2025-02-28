import { Settings } from './settings/Settings';
import { HistorySync } from './services/HistorySync';

export class BackgroundService {
  private settings: Settings;
  private historySync: HistorySync;

  constructor() {
    this.settings = new Settings();
    this.historySync = new HistorySync(this.settings);
  }

  async init(): Promise<void> {
    await this.settings.init();
    await this.historySync.init();
    await this.historySync.startSync();

    this.setupMessageListeners();
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Received message:', request);

      const handleError = (error: Error | unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error handling message:', error);
        sendResponse({ error: errorMessage });
      };

      // Handle synchronous operations immediately
      if (request.type === 'stopSync') {
        try {
          this.historySync.stopSync();
          sendResponse({ success: true });
        } catch (error) {
          handleError(error);
        }
        return false; // No need to keep port open
      }

      // Handle test summarization request
      if (request.type === 'testSummarize') {
        console.log('Received testSummarize request for URL:', request.url);
        
        // Create a wrapper function to safely send a response
        const safeResponse = (data: any) => {
          try {
            console.log('Sending response:', data);
            sendResponse(data);
          } catch (e) {
            console.error('Error sending response:', e);
          }
        };
        
        // Set a timeout to ensure we always respond, even if something goes wrong
        const timeoutId = setTimeout(() => {
          console.warn('Summarization timed out after 25 seconds');
          safeResponse({ 
            error: 'Summarization timed out after 25 seconds. Check the background console for details.' 
          });
        }, 25000); // 25 second timeout
        
        // Execute the summarization in a try-catch block
        try {
          if (!request.url) {
            clearTimeout(timeoutId);
            safeResponse({ error: 'No URL provided' });
            return true;
          }
          
          // Use Promise.race to implement a timeout for the summarization
          Promise.race([
            // The actual summarization operation
            (async () => {
              try {
                console.log('Starting summarization for URL:', request.url);
                
                // Access the private method using any type casting
                const summary = await (this.historySync as any).generateSummary(request.url);
                console.log('Test summarization result:', summary);
                
                // Clear the timeout since we're responding now
                clearTimeout(timeoutId);
                
                if (summary) {
                  safeResponse({ success: true, summary });
                } else {
                  safeResponse({ 
                    success: false, 
                    message: 'No summary was generated. Check the background console for details.' 
                  });
                }
              } catch (error) {
                console.error('Error in summarization:', error);
                clearTimeout(timeoutId);
                handleError(error);
              }
            })(),
            
            // A timeout promise that will resolve after 20 seconds
            new Promise(resolve => setTimeout(() => {
              console.warn('Internal summarization timeout reached (20s)');
              resolve(null);
            }, 20000))
          ]).catch(error => {
            console.error('Error in Promise.race:', error);
            clearTimeout(timeoutId);
            handleError(error);
          });
        } catch (error) {
          console.error('Error setting up summarization:', error);
          clearTimeout(timeoutId);
          handleError(error);
        }
        
        return true; // Keep message channel open
      }

      // Handle asynchronous operations
      if (request.type === 'getHistory' || request.type === 'startSync') {
        // Create a promise to handle the async operation
        const asyncOperation = async () => {
          try {
            if (request.type === 'getHistory') {
              const history = await this.historySync.getHistory();
              console.log('Sending history:', history);
              sendResponse(history || []);
            } else if (request.type === 'startSync') {
              await this.historySync.startSync();
              sendResponse({ success: true });
            }
          } catch (error) {
            handleError(error);
          }
        };

        // Execute the async operation and keep the message channel open
        asyncOperation();
        return true;
      }

      // Handle unknown message types
      console.warn('Unknown message type:', request.type);
      sendResponse({ error: `Unknown message type: ${request.type}` });
      return false;
    });
  }
}

console.log('Starting background service with summarization support...');
console.log('IMPORTANT: Check this console to see if the background service is loading properly');

// Add a global error handler to catch any unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const service = new BackgroundService();
service.init()
  .then(() => {
    console.log('Background service initialized successfully');
    console.log('To test summarization, open chrome-extension://<extension-id>/test-summarization.html');
  })
  .catch(error => {
    console.error('Error initializing background service:', error);
  });