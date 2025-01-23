const HISTORY_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

class HistoryManager {
    constructor(deviceId) {
        this.deviceId = deviceId;
        this.lastSync = 0;
    }

    async initialize() {
        // Start periodic sync
        setInterval(() => this.syncHistory(), HISTORY_SYNC_INTERVAL);
        return this.syncHistory();
    }

    async getRecentHistory(since = 0) {
        return new Promise((resolve) => {
            chrome.history.search({
                text: '',
                startTime: since,
                maxResults: 1000
            }, (historyItems) => {
                resolve(historyItems.map(item => ({
                    ...item,
                    deviceId: this.deviceId,
                    timestamp: Date.now()
                })));
            });
        });
    }

    async syncHistory() {
        try {
            const historyItems = await this.getRecentHistory(this.lastSync);
            if (historyItems.length > 0) {
                await fetch('https://api.chroniclesync.xyz/api/history/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        deviceId: this.deviceId,
                        items: historyItems
                    })
                });
                this.lastSync = Date.now();
            }
        } catch (error) {
            console.error('Failed to sync history:', error);
        }
    }
}

export default HistoryManager;