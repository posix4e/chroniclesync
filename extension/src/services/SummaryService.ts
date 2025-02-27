import { ModelService } from './ModelService';
import { SummaryData, SummarySettings, SummaryStatus } from '../types/summary';

export class SummaryService {
  private modelService: ModelService;
  private settings: SummarySettings;
  private summaryQueue: Map<string, Promise<SummaryData>> = new Map();

  constructor(settings: SummarySettings) {
    this.settings = settings;
    this.modelService = new ModelService(settings.modelConfig);
  }

  async summarizeContent(url: string, content: string): Promise<SummaryData> {
    if (!this.settings.enabled) {
      return this.createSummaryData('', 'completed');
    }

    // Check if already processing
    if (this.summaryQueue.has(url)) {
      return this.summaryQueue.get(url)!;
    }

    const summaryPromise = this.processSummary(content);
    this.summaryQueue.set(url, summaryPromise);

    try {
      const result = await summaryPromise;
      this.summaryQueue.delete(url);
      return result;
    } catch (error) {
      console.error('[Summary] Error processing summary:', error);
      this.summaryQueue.delete(url);
      return this.createSummaryData('', 'error');
    }
  }

  private async processSummary(content: string): Promise<SummaryData> {
    try {
      console.log('[Summary] Processing content');
      const extractedContent = this.extractMainContent(content);
      const summary = await this.modelService.generateSummary(extractedContent);
      return this.createSummaryData(summary, 'completed');
    } catch (error) {
      console.error('[Summary] Error in processSummary:', error);
      throw error;
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
      .map(el => el.textContent || '');

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
    this.summaryQueue.clear();
  }
}