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

      // Handle page content
      if (request.type === 'pageContent') {
        console.log('[Background] Received page content for:', request.url);
        // Create a promise to handle the async operation
        const asyncOperation = async () => {
          try {
            const entry = {
              url: request.url,
              title: request.title,
              content: request.content,
              visitTime: Date.now()
            };
            await this.historySync.processPageContent(entry);
            sendResponse({ success: true });
          } catch (error) {
            console.error('[Background] Error processing page content:', error);
            sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
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