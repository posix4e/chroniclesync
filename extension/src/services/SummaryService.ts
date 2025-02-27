import { HistoryEntry } from '../types';
import { SummaryData, SummarySettings, SummaryStatus } from '../types/summary';
import { ModelService } from './ModelService';
import { Settings } from '../settings/Settings';

export class SummaryService {
  private modelService: ModelService;
  private settings: Settings;
  private processingQueue: Set<string> = new Set();

  constructor(settings: Settings) {
    this.settings = settings;
    const modelConfig = settings.config?.summary?.modelConfig || {
      modelUrl: 'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1',
      inputLength: 512,
      outputLength: 512,
      threshold: 0.3
    };
    this.modelService = new ModelService(modelConfig);
  }

  async init(): Promise<void> {
    await this.modelService.init();
  }

  private async extractMainContent(html: string): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove script tags, style tags, and comments
    const elementsToRemove = doc.querySelectorAll('script, style, link, meta');
    elementsToRemove.forEach(el => el.remove());

    // Extract main content based on content priority settings
    const summarySettings = this.settings.config?.summary;
    if (!summarySettings) return '';

    const contentElements: string[] = [];

    // Always include main content
    const mainContent = doc.querySelector('main, article, .main-content');
    if (mainContent) {
      contentElements.push(mainContent.textContent || '');
    }

    if (summarySettings.contentPriority.headlines) {
      const headlines = doc.querySelectorAll('h1, h2, h3');
      headlines.forEach(h => contentElements.push(h.textContent || ''));
    }

    if (summarySettings.contentPriority.lists) {
      const lists = doc.querySelectorAll('ul, ol');
      lists.forEach(list => contentElements.push(list.textContent || ''));
    }

    if (summarySettings.contentPriority.quotes) {
      const quotes = doc.querySelectorAll('blockquote, q');
      quotes.forEach(quote => contentElements.push(quote.textContent || ''));
    }

    // Fallback to body content if no specific content was found
    if (contentElements.length === 0) {
      contentElements.push(doc.body.textContent || '');
    }

    return contentElements.join('\n').replace(/\s+/g, ' ').trim();
  }

  async processEntry(entry: HistoryEntry): Promise<HistoryEntry> {
    if (this.processingQueue.has(entry.url)) {
      console.log(`[Summary] Skipping ${entry.url} - already in queue`);
      return entry;
    }

    const summarySettings = this.settings.config?.summary;
    if (!summarySettings?.enabled || !summarySettings.autoSummarize) {
      console.log(`[Summary] Skipping ${entry.url} - summarization disabled`);
      return entry;
    }

    console.log(`[Summary] Starting summarization for: ${entry.url}`);
    console.log(`[Summary] Title: ${entry.title}`);

    try {
      this.processingQueue.add(entry.url);
      console.log(`[Summary] Added to processing queue: ${entry.url}`);

      const mainContent = await this.extractMainContent(entry.content || '');
      if (!mainContent) {
        throw new Error('No content to summarize');
      }
      console.log(`[Summary] Extracted content length: ${mainContent.length} characters`);

      console.log(`[Summary] Processing with model settings:`, {
        maxLength: summarySettings.summaryLength,
        minSentences: summarySettings.minSentences,
        maxSentences: summarySettings.maxSentences
      });

      const summary = await this.modelService.summarize(mainContent, {
        maxLength: summarySettings.summaryLength,
        minSentences: summarySettings.minSentences,
        maxSentences: summarySettings.maxSentences
      });

      console.log(`[Summary] Generated summary for ${entry.url}:`, summary);

      const summaryData: SummaryData = {
        content: summary,
        status: 'completed' as SummaryStatus,
        version: 1,
        lastModified: Date.now()
      };

      console.log(`[Summary] Completed summarization for: ${entry.url}`);

      return {
        ...entry,
        summary: summaryData,
        summaryStatus: 'completed'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Summary] Error processing summary for ${entry.url}:`, {
        error: errorMessage,
        details: error
      });
      return {
        ...entry,
        summaryStatus: 'error',
        summaryError: errorMessage
      };
    } finally {
      this.processingQueue.delete(entry.url);
      console.log(`[Summary] Removed from processing queue: ${entry.url}`);
    }
  }

  async processPendingEntries(entries: HistoryEntry[]): Promise<void> {
    const pendingEntries = entries.filter(entry => 
      !entry.summaryStatus || entry.summaryStatus === 'pending'
    );

    console.log(`[Summary] Processing ${pendingEntries.length} pending entries`);

    for (const entry of pendingEntries) {
      console.log(`[Summary] Processing pending entry: ${entry.url}`);
      await this.processEntry(entry);
    }

    console.log(`[Summary] Completed processing all pending entries`);
  }

  dispose(): void {
    this.modelService.dispose();
  }
}