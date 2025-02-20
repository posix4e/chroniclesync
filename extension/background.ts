import { BidirectionalSyncService } from './services/BidirectionalSyncService';

class BackgroundService {
  private syncService: BidirectionalSyncService;

  constructor() {
    this.syncService = BidirectionalSyncService.getInstance();
    this.initialize();
  }

  private async initialize() {
    // Start periodic sync
    await this.syncService.startPeriodicSync();

    // Listen for history updates
    chrome.history.onVisited.addListener((historyItem) => {
      this.handleHistoryUpdate(historyItem);
    });

    // Listen for extension installation/update
    chrome.runtime.onInstalled.addListener(() => {
      this.handleInstallation();
    });

    // Listen for messages from other parts of the extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });
  }

  private async handleHistoryUpdate(historyItem: chrome.history.HistoryItem) {
    try {
      console.log('History updated:', historyItem);
      await this.syncService.sync();
    } catch (error) {
      console.error('Failed to handle history update:', error);
    }
  }

  private async handleInstallation() {
    try {
      console.log('Extension installed/updated');
      await this.syncService.sync();
    } catch (error) {
      console.error('Failed to handle installation:', error);
    }
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) {
    try {
      switch (message.type) {
        case 'get-sync-status':
          sendResponse(this.syncService.getSyncStatus());
          break;

        case 'force-sync':
          await this.syncService.sync();
          sendResponse({ success: true });
          break;

        case 'get-history':
          const history = await this.syncService.getLocalHistory();
          sendResponse({ history });
          break;

        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }
}

// Initialize the background service
new BackgroundService();