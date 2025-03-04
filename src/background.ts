interface Summary {
  url: string;
  summary: string;
  timestamp: number;
}

class BackgroundService {
  private summaries: Map<string, Summary> = new Map();

  constructor() {
    this.loadSummaries();
    this.setupMessageListeners();
  }

  private async loadSummaries() {
    const result = await chrome.storage.local.get('summaries');
    if (result.summaries) {
      this.summaries = new Map(Object.entries(result.summaries));
    }
  }

  private async saveSummaries() {
    const summariesObj = Object.fromEntries(this.summaries);
    await chrome.storage.local.set({ summaries: summariesObj });
  }

  private setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.type) {
        case 'SAVE_SUMMARY':
          this.handleSaveSummary(message.payload);
          break;
        case 'GET_SUMMARY':
          this.handleGetSummary(message.payload, sendResponse);
          return true;
      }
    });
  }

  private async handleSaveSummary({ url, summary }: { url: string; summary: string }) {
    this.summaries.set(url, {
      url,
      summary,
      timestamp: Date.now()
    });
    await this.saveSummaries();
  }

  private handleGetSummary({ url }: { url: string }, sendResponse: (response: any) => void) {
    const summary = this.summaries.get(url);
    sendResponse({ summary });
  }
}

new BackgroundService();