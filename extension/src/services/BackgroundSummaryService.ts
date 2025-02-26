import { HistoryStore } from '../db/HistoryStore';
import { SummaryService } from './SummaryService';

export class BackgroundSummaryService {
  private static instance: BackgroundSummaryService;
  private historyStore: HistoryStore;
  private summaryService: SummaryService;
  private isProcessing = false;
  private processInterval: number | null = null;

  private constructor() {
    this.historyStore = new HistoryStore();
    this.summaryService = SummaryService.getInstance();
  }

  static getInstance(): BackgroundSummaryService {
    if (!BackgroundSummaryService.instance) {
      BackgroundSummaryService.instance = new BackgroundSummaryService();
    }
    return BackgroundSummaryService.instance;
  }

  async start(): Promise<void> {
    await this.historyStore.init();
    
    // Process entries every 5 minutes
    if (!this.processInterval) {
      this.processInterval = window.setInterval(() => {
        this.processEntries();
      }, 5 * 60 * 1000);
    }

    // Start initial processing
    this.processEntries();
  }

  stop(): void {
    if (this.processInterval) {
      window.clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  private async processEntries(): Promise<void> {
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;
      const entries = await this.historyStore.getEntriesNeedingSummary();

      for (const entry of entries) {
        try {
          // Get page content
          const response = await fetch(entry.url);
          if (!response.ok) {
            await this.historyStore.markSummaryError(entry.visitId);
            continue;
          }

          const text = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          
          // Extract main content (you might want to improve this based on your needs)
          const content = doc.body.textContent || '';
          
          // Generate summary
          const summary = await this.summaryService.summarizeText(content);
          
          if (summary) {
            await this.historyStore.updateSummary(entry.visitId, summary);
          } else {
            await this.historyStore.markSummaryError(entry.visitId);
          }
        } catch (error) {
          console.error('Error processing entry:', error);
          await this.historyStore.markSummaryError(entry.visitId);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}