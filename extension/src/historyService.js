class HistoryService {
  constructor(apiUrl, clientId) {
    this.apiUrl = apiUrl;
    this.clientId = clientId;
  }

  async getHistory(startTime = null, maxResults = 100) {
    return new Promise((resolve) => {
      chrome.history.search({
        text: '',
        startTime: startTime || (Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days by default
        maxResults: maxResults
      }, resolve);
    });
  }

  async syncHistory() {
    if (!this.clientId) {
      throw new Error('Client ID is required for history sync');
    }

    const history = await this.getHistory();
    const historyData = history.map(item => ({
      url: item.url,
      title: item.title,
      visitCount: item.visitCount,
      lastVisitTime: item.lastVisitTime,
      typedCount: item.typedCount
    }));

    const response = await fetch(`${this.apiUrl}/api/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': this.clientId
      },
      body: JSON.stringify({
        history: historyData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to sync history: ${response.statusText}`);
    }

    return response.json();
  }
}

export default HistoryService;