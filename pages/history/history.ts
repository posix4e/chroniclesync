import { BidirectionalSyncService } from '../../extension/services/BidirectionalSyncService';
import { HistoryItem } from '../../extension/types/history';

class HistoryViewer {
  private syncService: BidirectionalSyncService;
  private historyList: HTMLElement;
  private searchInput: HTMLInputElement;
  private timeFilter: HTMLSelectElement;
  private syncIndicator: HTMLElement;
  private syncText: HTMLElement;
  private loadingElement: HTMLElement;
  private offlineNotice: HTMLElement;
  private refreshInterval: number = 30000; // 30 seconds
  private currentHistory: HistoryItem[] = [];

  constructor() {
    this.syncService = BidirectionalSyncService.getInstance();
    this.initializeElements();
    this.setupEventListeners();
    this.startPeriodicRefresh();
    this.loadHistory();
  }

  private initializeElements() {
    this.historyList = document.getElementById('history-list') as HTMLElement;
    this.searchInput = document.getElementById('search') as HTMLInputElement;
    this.timeFilter = document.getElementById('timeFilter') as HTMLSelectElement;
    this.syncIndicator = document.getElementById('sync-indicator') as HTMLElement;
    this.syncText = document.getElementById('sync-text') as HTMLElement;
    this.loadingElement = document.getElementById('loading') as HTMLElement;
    this.offlineNotice = document.getElementById('offline-notice') as HTMLElement;
  }

  private setupEventListeners() {
    this.searchInput.addEventListener('input', () => this.filterHistory());
    this.timeFilter.addEventListener('change', () => this.filterHistory());

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'sync-event') {
        this.handleSyncEvent(message);
      }
    });

    window.addEventListener('online', () => this.handleConnectivityChange(true));
    window.addEventListener('offline', () => this.handleConnectivityChange(false));
  }

  private startPeriodicRefresh() {
    setInterval(() => this.loadHistory(), this.refreshInterval);
  }

  private async loadHistory() {
    this.showLoading(true);
    try {
      this.currentHistory = await this.syncService.getLocalHistory();
      this.updateSyncStatus();
      this.filterHistory();
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      this.showLoading(false);
    }
  }

  private filterHistory() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const timeRange = this.getTimeRange();
    
    const filteredHistory = this.currentHistory.filter(item => {
      const matchesSearch = item.title?.toLowerCase().includes(searchTerm) ||
                          item.url.toLowerCase().includes(searchTerm);
      const matchesTime = timeRange ? new Date(item.lastVisitTime) >= timeRange : true;
      return matchesSearch && matchesTime;
    });

    this.renderHistory(filteredHistory);
  }

  private getTimeRange(): Date | null {
    const now = new Date();
    switch (this.timeFilter.value) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      default:
        return null;
    }
  }

  private renderHistory(history: HistoryItem[]) {
    this.historyList.innerHTML = '';
    
    history.sort((a, b) => 
      new Date(b.lastVisitTime).getTime() - new Date(a.lastVisitTime).getTime()
    );

    history.forEach(item => {
      const element = this.createHistoryItemElement(item);
      this.historyList.appendChild(element);
    });
  }

  private createHistoryItemElement(item: HistoryItem): HTMLElement {
    const element = document.createElement('div');
    element.className = 'history-item';
    
    const favicon = document.createElement('img');
    favicon.className = 'favicon';
    favicon.src = `chrome://favicon/${item.url}`;
    favicon.alt = '';

    const details = document.createElement('div');
    details.className = 'details';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = item.title || item.url;

    const url = document.createElement('div');
    url.className = 'url';
    url.textContent = item.url;

    const time = document.createElement('div');
    time.className = 'time';
    time.textContent = new Date(item.lastVisitTime).toLocaleString();

    details.appendChild(title);
    details.appendChild(url);
    details.appendChild(time);

    element.appendChild(favicon);
    element.appendChild(details);

    element.addEventListener('click', () => {
      chrome.tabs.create({ url: item.url });
    });

    return element;
  }

  private handleSyncEvent(message: any) {
    if (message.event === 'sync-complete') {
      this.loadHistory();
    }
    this.updateSyncStatus();
  }

  private handleConnectivityChange(isOnline: boolean) {
    this.offlineNotice.classList.toggle('hidden', isOnline);
    this.updateSyncStatus();
  }

  private updateSyncStatus() {
    const status = this.syncService.getSyncStatus();
    
    this.syncIndicator.classList.toggle('offline', !status.isOnline);
    this.syncIndicator.classList.toggle('syncing', status.isSyncing);
    
    const lastSync = status.lastSync.getTime() > 0
      ? `Last synced: ${status.lastSync.toLocaleString()}`
      : 'Never synced';
    
    this.syncText.textContent = status.isSyncing ? 'Syncing...' : lastSync;
  }

  private showLoading(show: boolean) {
    this.loadingElement.classList.toggle('hidden', !show);
  }
}

// Initialize the history viewer when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new HistoryViewer();
});