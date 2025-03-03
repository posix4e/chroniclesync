import { Settings } from './settings/Settings';
import { HistorySync } from './services/HistorySync';
import { SummaryData } from './services/SummarizationService';

export class BackgroundService {
  private settings: Settings;
  private historySync: HistorySync;
  private pageSummaries: Map<string, SummaryData> = new Map();
  private summarizationService: any = null;

  constructor() {
    this.settings = new Settings();
    this.historySync = new HistorySync(this.settings);
  }

  async init(): Promise<void> {
    await this.settings.init();
    await this.historySync.init();
    await this.historySync.startSync();
    await this.loadSummaries();

    this.setupMessageListeners();
  }

  private async loadSummarizationService() {
    if (!this.summarizationService) {
      try {
        // Dynamically import the summarization service to avoid loading it unnecessarily
        const { SummarizationService } = await import('./services/SummarizationService');
        this.summarizationService = SummarizationService.getInstance();
        await this.summarizationService.initialize();
      } catch (error) {
        console.error('Failed to load summarization service:', error);
        throw error;
      }
    }
    return this.summarizationService;
  }

  private async loadSummaries(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['pageSummaries']);
      if (result.pageSummaries) {
        // Convert from stored object to Map
        const summaries = JSON.parse(result.pageSummaries);
        this.pageSummaries = new Map(Object.entries(summaries));
        console.log(`Loaded ${this.pageSummaries.size} page summaries from storage`);
      }
    } catch (error) {
      console.error('Error loading summaries from storage:', error);
    }
  }

  private async saveSummaries(): Promise<void> {
    try {
      // Convert Map to object for storage
      const summariesObj = Object.fromEntries(this.pageSummaries);
      await chrome.storage.local.set({ pageSummaries: JSON.stringify(summariesObj) });
    } catch (error) {
      console.error('Error saving summaries to storage:', error);
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
          sendResponse({ success: true });
        } catch (error) {
          handleError(error);
        }
        return false; // No need to keep port open
      }

      // Handle summarization operations
      if (request.type === 'summarizePage') {
        const asyncOperation = async () => {
          try {
            const { url, title, content } = request.data;
            
            // Skip if we already have a recent summary (less than 1 day old)
            const existingSummary = this.pageSummaries.get(url);
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            
            if (existingSummary && existingSummary.timestamp > oneDayAgo) {
              console.log('Using existing summary for:', url);
              sendResponse({ success: true, summary: existingSummary });
              return;
            }
            
            // Load the summarization service if needed
            const service = await this.loadSummarizationService();
            
            // Generate summary
            const summary = await service.summarizeText(content);
            
            // Store the summary
            const summaryData: SummaryData = {
              url,
              title,
              summary,
              timestamp: Date.now()
            };
            
            this.pageSummaries.set(url, summaryData);
            await this.saveSummaries();
            
            console.log('Generated summary for:', url);
            sendResponse({ success: true, summary: summaryData });
          } catch (error) {
            handleError(error);
          }
        };
        
        asyncOperation();
        return true; // Keep the message channel open
      }
      
      // Handle get summary request
      if (request.type === 'getSummary') {
        try {
          const { url } = request;
          const summary = this.pageSummaries.get(url);
          sendResponse({ success: true, summary });
        } catch (error) {
          handleError(error);
        }
        return false;
      }
      
      // Handle get all summaries request
      if (request.type === 'getAllSummaries') {
        try {
          const summaries = Array.from(this.pageSummaries.values());
          sendResponse({ success: true, summaries });
        } catch (error) {
          handleError(error);
        }
        return false;
      }
      
      // Handle delete summary request
      if (request.type === 'deleteSummary') {
        const asyncOperation = async () => {
          try {
            const { url } = request;
            this.pageSummaries.delete(url);
            await this.saveSummaries();
            sendResponse({ success: true });
          } catch (error) {
            handleError(error);
          }
        };
        
        asyncOperation();
        return true;
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