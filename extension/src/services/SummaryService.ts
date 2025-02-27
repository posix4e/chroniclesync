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

  getSettings(): SummarySettings {
    return this.settings;
  }

  async summarizeContent(url: string, content: { elements: string[] }): Promise<SummaryData> {
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

  private async processSummary(content: { elements: string[] }): Promise<SummaryData> {
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

  private extractMainContent(content: { elements: string[] }): string {
    console.log('[Summary] Extracted elements:', {
      totalElements: content.elements.length,
      nonEmptyElements: content.elements.filter(text => text.trim().length > 0).length,
      settings: this.settings.contentPriority
    });

    const processedContent = content.elements
      .filter(text => text.trim().length > 0)
      .join(' ')
      .slice(0, this.settings.modelConfig.inputLength);

    console.log('[Summary] Processed content:', {
      originalLength: processedContent.length,
      truncatedLength: Math.min(processedContent.length, this.settings.modelConfig.inputLength),
      firstWords: processedContent.split(' ').slice(0, 10).join(' ') + '...'
    });

    return processedContent;
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