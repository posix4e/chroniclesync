import { ModelService } from './ModelService';
import { SummaryData, SummarySettings, SummaryStatus } from '../types/summary';

export class SummaryService {
  private modelService: ModelService;
  private settings: SummarySettings;
  private queue: Map<string, Promise<SummaryData>> = new Map();

  constructor(settings: SummarySettings) {
    this.settings = settings;
    this.modelService = new ModelService(settings.modelConfig);
  }

  async initialize(): Promise<void> {
    await this.modelService.initialize();
  }

  async summarize(url: string, content: string): Promise<SummaryData> {
    if (!this.settings.enabled) {
      return this.createSummaryData('', 'error');
    }

    if (this.queue.has(url)) {
      return this.queue.get(url)!;
    }

    const summaryPromise = this.processSummary(content);
    this.queue.set(url, summaryPromise);

    try {
      const result = await summaryPromise;
      this.queue.delete(url);
      return result;
    } catch (error) {
      this.queue.delete(url);
      console.error('[Summary] Error generating summary:', error);
      return this.createSummaryData('', 'error');
    }
  }

  private async processSummary(content: string): Promise<SummaryData> {
    console.log('[Summary] Processing content for summarization');
    
    const mainContent = this.extractMainContent(content);
    if (!mainContent) {
      return this.createSummaryData('', 'error');
    }

    try {
      const summary = await this.modelService.summarize(mainContent);
      return this.createSummaryData(summary, 'completed');
    } catch (error) {
      console.error('[Summary] Error in summarization:', error);
      return this.createSummaryData('', 'error');
    }
  }

  private extractMainContent(content: string): string {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    const elements: string[] = [];

    if (this.settings.contentPriority.headlines) {
      elements.push(...Array.from(doc.querySelectorAll('h1, h2, h3'))
        .map(el => el.textContent || ''));
    }

    if (this.settings.contentPriority.lists) {
      elements.push(...Array.from(doc.querySelectorAll('ul, ol'))
        .map(el => el.textContent || ''));
    }

    const paragraphs = Array.from(doc.querySelectorAll('p'))
      .map(el => el.textContent || '')
      .filter(text => text.length > 50);

    if (this.settings.contentPriority.quotes) {
      elements.push(...Array.from(doc.querySelectorAll('blockquote'))
        .map(el => el.textContent || ''));
    }

    elements.push(...paragraphs);

    return elements
      .filter(text => text.trim().length > 0)
      .join(' ')
      .slice(0, this.settings.modelConfig.inputLength);
  }

  private createSummaryData(content: string, status: SummaryStatus): SummaryData {
    return {
      content,
      status,
      version: 1,
      lastModified: Date.now()
    };
  }

  dispose(): void {
    this.modelService.dispose();
    this.queue.clear();
  }
}