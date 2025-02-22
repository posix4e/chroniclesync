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

      const handleError = (error: any) => {
        console.error('Error handling message:', error);
        try {
          sendResponse({ error: error.message || 'Unknown error' });
        } catch (e) {
          console.error('Error sending response:', e);
        }
      };

      try {
        switch (request.type) {
        case 'getHistory':
          // Wrap in Promise.resolve to handle both synchronous and asynchronous errors
          Promise.resolve()
            .then(() => this.historySync.getHistory(request.limit))
            .then(history => {
              console.log('Sending history:', history);
              try {
                sendResponse(history || []);
              } catch (e) {
                console.error('Error sending history response:', e);
              }
            })
            .catch(handleError);
          return true; // Keep the message channel open

        case 'startSync':
          Promise.resolve()
            .then(() => this.historySync.startSync())
            .then(() => {
              try {
                sendResponse({ success: true });
              } catch (e) {
                console.error('Error sending sync response:', e);
              }
            })
            .catch(handleError);
          return true; // Keep the message channel open

        case 'stopSync':
          try {
            this.historySync.stopSync();
            sendResponse({ success: true });
          } catch (error) {
            handleError(error);
          }
          return true; // Keep the message channel open

        default:
          console.warn('Unknown message type:', request.type);
          try {
            sendResponse({ error: `Unknown message type: ${request.type}` });
          } catch (e) {
            console.error('Error sending error response:', e);
          }
          return true; // Keep the message channel open
        }
      } catch (error) {
        handleError(error);
        return true; // Keep the message channel open
      }
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