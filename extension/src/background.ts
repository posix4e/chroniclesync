import { Settings } from './settings/Settings';
import { HistorySync } from './services/HistorySync';
import { SummarizationService, DEFAULT_MODEL } from './services/SummarizationService';
import { HistoryStore } from './db/HistoryStore';

export class BackgroundService {
  private settings: Settings;
  private historySync: HistorySync;
  private summarizationService: SummarizationService | null = null;

  constructor() {
    this.settings = new Settings();
    this.historySync = new HistorySync(this.settings);
  }

  async init(): Promise<void> {
    await this.settings.init();
    await this.historySync.init();
    await this.historySync.startSync();
    await this.initSummarizationService();

    this.setupMessageListeners();
    this.setupTabListeners();
  }

  private async initSummarizationService(): Promise<void> {
    try {
      const config = await chrome.storage.sync.get(['enableSummarization', 'summarizationModel']);
      
      if (config.enableSummarization === false) {
        console.log('Summarization is disabled in settings');
        this.summarizationService = null;
        return;
      }

      const modelName = config.summarizationModel || DEFAULT_MODEL;
      console.log(`Initializing summarization service with model: ${modelName}`);
      
      this.summarizationService = new SummarizationService({
        model: modelName
      });
      
      // Pre-initialize the model
      await this.summarizationService.init();
    } catch (error) {
      console.error('Error initializing summarization service:', error);
      this.summarizationService = null;
    }
  }

  private async extractPageContent(tabId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: 'extractContent' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response && response.error) {
          reject(new Error(response.error));
          return;
        }
        
        if (response && response.content) {
          resolve(response.content);
        } else {
          reject(new Error('No content extracted'));
        }
      });
    });
  }

  private async summarizeTab(tabId: number, url: string, visitId: string): Promise<void> {
    try {
      // Check if summarization is enabled
      const config = await chrome.storage.sync.get(['enableSummarization']);
      if (config.enableSummarization === false) {
        console.log('Summarization is disabled, skipping');
        return;
      }

      // Initialize summarization service if needed
      if (!this.summarizationService) {
        await this.initSummarizationService();
      }
      
      if (!this.summarizationService) {
        console.error('Summarization service not available');
        return;
      }

      console.log(`Starting summarization for tab ${tabId}, URL: ${url}`);
      
      // Extract content from the page
      const content = await this.extractPageContent(tabId);
      
      if (!content || content.trim().length < 100) {
        console.log('Not enough content to summarize');
        return;
      }
      
      console.log(`Extracted ${content.length} characters of content`);
      
      // Generate summary
      const summary = await this.summarizationService.summarize(content);
      
      if (summary) {
        console.log('Generated summary:', summary);
        
        // Store the summary
        const historyStore = new HistoryStore();
        await historyStore.init();
        await historyStore.updateSummary(visitId, summary);
        
        console.log('Summary stored successfully');
      }
    } catch (error) {
      console.error('Error during summarization:', error);
      
      // Store the error
      try {
        const historyStore = new HistoryStore();
        await historyStore.init();
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during summarization';
        await historyStore.setSummarizationError(visitId, errorMessage);
      } catch (storeError) {
        console.error('Error storing summarization error:', storeError);
      }
    }
  }

  private setupTabListeners(): void {
    // Listen for navigation events
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.url && tab.url && tab.id) {
        console.debug(`Navigation to: ${changeInfo.url}`);
        
        // Get the visit ID for this navigation
        const visits = await chrome.history.getVisits({ url: tab.url });
        if (visits && visits.length > 0) {
          const latestVisit = visits[visits.length - 1];
          
          // Trigger summarization for this tab
          this.summarizeTab(tab.id, tab.url, latestVisit.visitId);
        }
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

      // Handle asynchronous operations
      if (request.type === 'getHistory' || request.type === 'startSync' || request.type === 'summarizeEntry') {
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
            } else if (request.type === 'summarizeEntry') {
              const { visitId, tabId } = request;
              if (!tabId || !visitId) {
                sendResponse({ error: 'Missing required parameters' });
                return;
              }
              
              chrome.tabs.get(tabId, async (tab) => {
                if (chrome.runtime.lastError) {
                  sendResponse({ error: chrome.runtime.lastError.message });
                  return;
                }
                
                if (!tab || !tab.url) {
                  sendResponse({ error: 'Tab not found or has no URL' });
                  return;
                }
                
                try {
                  await this.summarizeTab(tabId, tab.url, visitId);
                  sendResponse({ success: true });
                } catch (error) {
                  sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
                }
              });
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