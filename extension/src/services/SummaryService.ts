import { pipeline } from '@xenova/transformers';

export class SummaryService {
  private static instance: SummaryService;
  private summarizer: any;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): SummaryService {
    if (!SummaryService.instance) {
      SummaryService.instance = new SummaryService();
    }
    return SummaryService.instance;
  }

  private async initialize() {
    if (this.summarizer) return;
    if (this.isInitializing) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = new Promise<void>(async (resolve, reject) => {
      try {
        this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        this.isInitializing = false;
        resolve();
      } catch (error) {
        this.isInitializing = false;
        reject(error);
      }
    });

    return this.initPromise;
  }

  async summarizeText(text: string): Promise<string> {
    await this.initialize();
    
    try {
      // Clean and truncate text if needed (model has max input length)
      const cleanText = text.trim().substring(0, 1024);
      if (!cleanText) return '';

      const result = await this.summarizer(cleanText, {
        max_length: 150,
        min_length: 30,
        do_sample: false
      });

      return result[0].summary_text;
    } catch (error) {
      console.error('Error summarizing text:', error);
      return '';
    }
  }
}