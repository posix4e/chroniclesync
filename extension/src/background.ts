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
        console.log('%c[ChronicleSync] Summarization is disabled in settings', 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
        this.summarizationService = null;
        return;
      }

      const modelName = config.summarizationModel || DEFAULT_MODEL;
      console.log('%c[ChronicleSync] Initializing summarization service with model: ' + modelName, 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
      
      this.summarizationService = new SummarizationService({
        model: modelName
      });
      
      // Pre-initialize the model
      await this.summarizationService.init();
      console.log('%c[ChronicleSync] Summarization service initialized successfully', 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
    } catch (error) {
      console.error('%c[ChronicleSync] Error initializing summarization service:', 'background: #ea4335; color: white; padding: 2px 4px; border-radius: 2px;', error);
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
        console.log('%c[ChronicleSync] Summarization is disabled, skipping', 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
        return;
      }

      // Initialize summarization service if needed
      if (!this.summarizationService) {
        console.log('%c[ChronicleSync] Summarization service not initialized, initializing now...', 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
        await this.initSummarizationService();
      }
      
      if (!this.summarizationService) {
        console.error('%c[ChronicleSync] Summarization service not available after initialization attempt', 'background: #ea4335; color: white; padding: 2px 4px; border-radius: 2px;');
        return;
      }

      console.log('%c[ChronicleSync] Starting summarization for tab ' + tabId + ', URL: ' + url, 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
      
      // Extract content from the page
      console.log('%c[ChronicleSync] Extracting content from page...', 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
      const content = await this.extractPageContent(tabId);
      
      if (!content || content.trim().length < 100) {
        console.log('%c[ChronicleSync] Not enough content to summarize (less than 100 characters)', 'background: #fbbc05; color: black; padding: 2px 4px; border-radius: 2px;');
        return;
      }
      
      console.log('%c[ChronicleSync] Extracted ' + content.length + ' characters of content', 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
      
      // Generate summary
      console.log('%c[ChronicleSync] Sending content to summarization service...', 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
      const summary = await this.summarizationService.summarize(content);
      
      if (summary) {
        console.log('%c[ChronicleSync] Generated summary:', 'background: #34a853; color: white; padding: 2px 4px; border-radius: 2px;', summary);
        
        // Store the summary
        console.log('%c[ChronicleSync] Storing summary in history...', 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
        const historyStore = new HistoryStore();
        await historyStore.init();
        await historyStore.updateSummary(visitId, summary);
        
        console.log('%c[ChronicleSync] Summary stored successfully', 'background: #34a853; color: white; padding: 2px 4px; border-radius: 2px;');
        
        // Show notification to user
        this.showSummarizationNotification(url, summary);
      }
    } catch (error) {
      console.error('%c[ChronicleSync] Error during summarization:', 'background: #ea4335; color: white; padding: 2px 4px; border-radius: 2px;', error);
      
      // Store the error
      try {
        const historyStore = new HistoryStore();
        await historyStore.init();
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during summarization';
        await historyStore.setSummarizationError(visitId, errorMessage);
        console.error('%c[ChronicleSync] Stored summarization error in history', 'background: #ea4335; color: white; padding: 2px 4px; border-radius: 2px;');
      } catch (storeError) {
        console.error('%c[ChronicleSync] Error storing summarization error:', 'background: #ea4335; color: white; padding: 2px 4px; border-radius: 2px;', storeError);
      }
    }
  }

  private showSummarizationNotification(url: string, summary: string): void {
    try {
      // Get the domain from the URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Create a notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon128.png'),
        title: `Summary for ${domain}`,
        message: summary.length > 100 ? summary.substring(0, 97) + '...' : summary,
        contextMessage: 'ChronicleSync Summarization',
        priority: 1
      });
      
      console.log('%c[ChronicleSync] Notification shown for summary', 'background: #34a853; color: white; padding: 2px 4px; border-radius: 2px;');
    } catch (error) {
      console.error('%c[ChronicleSync] Error showing notification:', 'background: #ea4335; color: white; padding: 2px 4px; border-radius: 2px;', error);
    }
  }
  
  private setupTabListeners(): void {
    // Listen for navigation events
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.url && tab.url && tab.id) {
        console.log('%c[ChronicleSync] Navigation detected to: ' + changeInfo.url, 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
        
        // Wait for the page to load completely
        console.log('%c[ChronicleSync] Waiting for page to load completely...', 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
        
        // Wait a bit to ensure the page is loaded and history is updated
        setTimeout(async () => {
          try {
            if (tab.url) {
              // Get the visit ID for this navigation
              console.log('%c[ChronicleSync] Getting visit ID for URL: ' + tab.url, 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
              const visits = await chrome.history.getVisits({ url: tab.url });
              
              if (visits && visits.length > 0) {
                const latestVisit = visits[visits.length - 1];
                console.log('%c[ChronicleSync] Found visit ID: ' + latestVisit.visitId, 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
                
                // Trigger summarization for this tab
                if (tab.id) {
                  console.log('%c[ChronicleSync] Triggering summarization for tab ' + tab.id, 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 2px;');
                  this.summarizeTab(tab.id, tab.url, latestVisit.visitId);
                }
              } else {
                console.log('%c[ChronicleSync] No visit history found for URL: ' + tab.url, 'background: #fbbc05; color: black; padding: 2px 4px; border-radius: 2px;');
              }
            }
          } catch (error) {
            console.error('%c[ChronicleSync] Error in tab update listener:', 'background: #ea4335; color: white; padding: 2px 4px; border-radius: 2px;', error);
          }
        }, 2000); // Wait 2 seconds to ensure page is loaded
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