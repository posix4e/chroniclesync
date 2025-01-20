export class HistoryManager {
    async syncHistory(): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.history.search({
                text: '',
                startTime: Date.now() - (30 * 24 * 60 * 60 * 1000), // Last 30 days
                maxResults: 1000
            }, async (historyItems) => {
                try {
                    // Process history items in chunks to avoid overwhelming storage
                    const chunkSize = 50;
                    for (let i = 0; i < historyItems.length; i += chunkSize) {
                        const chunk = historyItems.slice(i, i + chunkSize);
                        await Promise.all(chunk.map(item => this.processHistoryItem(item)));
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    private async processHistoryItem(item: chrome.history.HistoryItem): Promise<void> {
        // Dispatch a custom event that background.ts will listen for
        chrome.runtime.sendMessage({
            type: 'PROCESS_HISTORY_ITEM',
            item: item
        });
    }
}