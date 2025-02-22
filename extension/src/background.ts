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
        this.historySync.getHistory(request.limit).then(sendResponse);
        return true;
      case 'startSync':
        this.historySync.startSync().then(() => sendResponse({ success: true }));
        return true;
      case 'stopSync':
        this.historySync.stopSync();
        sendResponse({ success: true });
        return false;
      }
    });
  }
}

const service = new BackgroundService();
service.init().catch(error => {
  console.error('Error initializing background service:', error);
});