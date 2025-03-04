import { SummarizationService } from './services/SummarizationService';

interface PageSummary {
    summary: string;
    timestamp: number;
}

const summaryCache = new Map<string, PageSummary>();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SUMMARIZE_PAGE' && sender.tab) {
        handleSummarization(sender.tab.id!, message.url);
        return true;
    }
});

async function handleSummarization(tabId: number, url: string) {
    try {
        // Check cache first
        const cached = summaryCache.get(url);
        if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
            return;
        }

        // Execute content script to get page content
        const [{ result: content }] = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                const service = SummarizationService.getInstance();
                return service.extractMainContent(document);
            }
        });

        if (!content) {
            console.warn('No content found to summarize');
            return;
        }

        const summarizer = SummarizationService.getInstance();
        const summary = await summarizer.summarize(content);

        // Cache the summary
        summaryCache.set(url, {
            summary,
            timestamp: Date.now()
        });

        // Store in Chrome storage
        await chrome.storage.local.set({
            [`summary_${url}`]: {
                summary,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error('Summarization failed:', error);
    }
}