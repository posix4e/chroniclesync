import { Settings } from './settings/Settings';
import { HistorySync } from './services/HistorySync';
import { SummaryService } from './services/SummaryService';

export class BackgroundService {
  private settings: Settings;
  private historySync: HistorySync;
  private summaryService: SummaryService;

  constructor() {
    this.settings = new Settings();
    this.historySync = new HistorySync(this.settings);
    this.summaryService = new SummaryService(this.historySync.getHistoryStore());
  }

  async init(): Promise<void> {
    try {
      await this.settings.init();
      await this.historySync.initStore();
      await this.historySync.init();
      
      // Initialize model in parallel with sync
      const [modelInit] = await Promise.allSettled([
        this.summaryService['initModel'](),
        this.historySync.startSync()
      ]);

      if (modelInit.status === 'rejected') {
        console.error('Failed to initialize summarization model:', modelInit.reason);
      } else {
        await this.summaryService.startBackgroundProcessing();
      }

      this.setupMessageListeners();
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error;
    }
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
          this.summaryService.stopBackgroundProcessing();
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

      // Handle summary regeneration
      if (request.type === 'regenerateSummary') {
        const asyncOperation = async () => {
          try {
            const entry = await this.historySync.getHistoryEntry(request.visitId);
            if (!entry) {
              throw new Error('Entry not found');
            }

            // Reset summary status and trigger regeneration
            await this.historySync.getHistoryStore().updateEntry({
              ...entry,
              summaryStatus: 'pending',
              summary: undefined,
              summaryError: undefined
            });

            // Process the entry
            await this.summaryService['processEntry'](entry);
            sendResponse({ success: true });
          } catch (error) {
            handleError(error);
          }
        };

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