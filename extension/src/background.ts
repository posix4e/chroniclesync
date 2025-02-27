import { Settings } from './settings/Settings';
import { HistorySync } from './services/HistorySync';
import { SummaryService } from './services/SummaryService';
import { DEFAULT_SUMMARY_SETTINGS } from './types/summary';

export class BackgroundService {
  private settings: Settings;
  private historySync: HistorySync;
  private summaryService: SummaryService;

  constructor() {
    this.settings = new Settings();
    this.historySync = new HistorySync(this.settings);
    this.summaryService = new SummaryService(DEFAULT_SUMMARY_SETTINGS);
  }

  async init(): Promise<void> {
    await this.settings.init();
    await this.historySync.init();
    await this.summaryService.initialize();
    await this.historySync.startSync();

    this.setupMessageListeners();
    this.setupTabListeners();
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
      if (request.type === 'getHistory' || request.type === 'startSync' || request.type === 'getSummary') {
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
            } else if (request.type === 'getSummary') {
              const summary = await this.summaryService.summarize(request.url, request.content);
              sendResponse(summary);
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

  private setupTabListeners(): void {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        console.log('[Background] Tab updated:', tab.url);
        try {
          // Execute content script to get page content
          const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => document.documentElement.outerHTML
          });
          
          if (!results || !results[0] || !results[0].result) {
            console.error('[Background] Failed to get page content');
            return;
          }
          
          const content = results[0].result as string;

          // Generate summary
          const summary = await this.summaryService.summarize(tab.url, content);
          console.log('[Background] Generated summary:', summary);

          // Update history entry with summary
          await this.historySync.updateEntry(tab.url, {
            summary: summary.content,
            summaryStatus: summary.status
          });
        } catch (error) {
          console.error('[Background] Error processing tab update:', error);
        }
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