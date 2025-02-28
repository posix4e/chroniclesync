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
        const asyncOperation = async () => {
          try {
            console.log('Testing summarization for URL:', request.url);
            // Access the private method using any type casting
            const summary = await (this.historySync as any).generateSummary(request.url);
            console.log('Test summarization result:', summary);
            sendResponse({ success: true, summary });
          } catch (error) {
            handleError(error);
          }
        };
        
        asyncOperation();
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

console.log('Starting background service...');
const service = new BackgroundService();
service.init()
  .then(() => {
    console.log('Background service initialized successfully');
  })
  .catch(error => {
    console.error('Error initializing background service:', error);
  });