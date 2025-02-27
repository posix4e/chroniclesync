import { ModelService } from './ModelService';
import { SummaryData, SummarySettings, SummaryStatus } from '../types/summary';

export class SummaryService {
  private modelService: ModelService;
  private settings: SummarySettings;
  private summaryQueue: Map<string, Promise<SummaryData>> = new Map();

  constructor(settings: SummarySettings) {
    this.settings = settings;
    this.modelService = new ModelService(settings);
  }

  async summarize(url: string, content: string): Promise<SummaryData> {
    if (!this.settings.enabled) {
      return this.createSummaryData('', 'completed');
    }

    if (this.summaryQueue.has(url)) {
      return this.summaryQueue.get(url)!;
    }

    const summaryPromise = this.generateSummary(content);
    this.summaryQueue.set(url, summaryPromise);

    try {
      const result = await summaryPromise;
      this.summaryQueue.delete(url);
      return result;
    } catch (error) {
      this.summaryQueue.delete(url);
      console.error('[Summary] Error generating summary:', error);
      return this.createSummaryData('', 'error');
    }
  }

  private async generateSummary(content: string): Promise<SummaryData> {
    try {
      console.log('[Summary] Starting summarization');
      const cleanContent = this.extractMainContent(content);
      const summary = await this.modelService.generateSummary(cleanContent);
      return this.createSummaryData(summary, 'completed');
    } catch (error) {
      console.error('[Summary] Summarization failed:', error);
      throw error;
    }
  }

  private extractMainContent(content: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

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
  }
}