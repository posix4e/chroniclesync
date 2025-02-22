import { Settings } from './settings/Settings';
import { HistorySync } from './services/HistorySync';

class BackgroundService {
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
      switch (request.type) {
      case 'getHistory':
        this.historySync.getHistory(request.limit)
          .then(history => {
            console.log('Sending history:', history);
            sendResponse(history);
          })
          .catch(error => {
            console.error('Error getting history:', error);
            sendResponse([]);
          });
        return true;
      case 'startSync':
        this.historySync.startSync()
          .then(() => sendResponse({ success: true }))
          .catch(error => {
            console.error('Error starting sync:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;
      case 'stopSync':
        this.historySync.stopSync();
        sendResponse({ success: true });
        return false;
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