import { Settings } from './settings/Settings';
import { HistorySync } from './services/HistorySync';

interface PageSummary {
  url: string;
  title: string;
  summary: string;
  timestamp: number;
}

export class BackgroundService {
  private settings: Settings;
  private historySync: HistorySync;
  private pageSummaries: Map<string, PageSummary> = new Map();

  constructor() {
    this.settings = new Settings();
    this.historySync = new HistorySync(this.settings);
  }

  async init(): Promise<void> {
    await this.settings.init();
    await this.historySync.init();
    await this.historySync.startSync();
    await this.loadSavedSummaries();
    
    this.setupMessageListeners();
    this.setupContentScriptInjection();
  }
  
  private async loadSavedSummaries(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['pageSummaries']);
      if (result.pageSummaries) {
        const summaries = JSON.parse(result.pageSummaries);
        for (const [url, summary] of Object.entries(summaries)) {
          this.pageSummaries.set(url, summary as PageSummary);
        }
        console.log(`Loaded ${this.pageSummaries.size} saved summaries`);
      }
    } catch (error) {
      console.error('Error loading saved summaries:', error);
    }
  }
  
  private async saveSummaries(): Promise<void> {
    try {
      const summariesObj: Record<string, PageSummary> = {};
      this.pageSummaries.forEach((summary, url) => {
        summariesObj[url] = summary;
      });
      
      await chrome.storage.local.set({
        pageSummaries: JSON.stringify(summariesObj)
      });
    } catch (error) {
      console.error('Error saving summaries:', error);
    }
  }
  
  private setupContentScriptInjection(): void {
    // Inject content script when a new page is loaded
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && 
          !tab.url.startsWith('chrome://') && 
          !tab.url.startsWith('chrome-extension://')) {
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        }).catch(error => {
          console.error('Error injecting content script:', error);
        });
      }
    });
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
      
      // Handle summary storage
      if (request.type === 'storeSummary') {
        try {
          const { url, title, summary, timestamp } = request.data;
          console.log('Storing summary for:', url);
          console.log('Summary:', summary);
          
          this.pageSummaries.set(url, {
            url,
            title,
            summary,
            timestamp
          });
          
          this.saveSummaries();
          sendResponse({ success: true });
        } catch (error) {
          handleError(error);
        }
        return false;
      }
      
      // Handle summary retrieval
      if (request.type === 'getSummary') {
        try {
          const { url } = request;
          const summary = this.pageSummaries.get(url);
          console.log('Retrieved summary for:', url, summary);
          sendResponse({ summary });
        } catch (error) {
          handleError(error);
        }
        return false;
      }
      
      // Handle getting all summaries
      if (request.type === 'getAllSummaries') {
        try {
          const summaries = Array.from(this.pageSummaries.values());
          console.log('Sending all summaries:', summaries.length);
          sendResponse({ summaries });
        } catch (error) {
          handleError(error);
        }
        return false;
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