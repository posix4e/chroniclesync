import { pipeline, env } from '@xenova/transformers';

// Set environment variables
env.allowLocalModels = true;
env.useBrowserCache = true;

export interface SummarizationOptions {
  model: string;
  maxLength?: number;
  minLength?: number;
}

export class SummarizationService {
  private summarizer: any = null;
  private modelName: string;
  private maxLength: number;
  private minLength: number;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(options: SummarizationOptions) {
    this.modelName = options.model;
    this.maxLength = options.maxLength || 150;
    this.minLength = options.minLength || 30;
  }

  async init(): Promise<void> {
    if (this.summarizer) return;
    
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    console.log('%c[ChronicleSync Summarization] Initializing model: ' + this.modelName, 'background: #34a853; color: white; padding: 2px 4px; border-radius: 2px;');
    
    this.initPromise = new Promise<void>(async (resolve, reject) => {
      try {
        this.summarizer = await pipeline('summarization', this.modelName);
        console.log('%c[ChronicleSync Summarization] Model loaded successfully', 'background: #34a853; color: white; padding: 2px 4px; border-radius: 2px;');
        this.isInitializing = false;
        resolve();
      } catch (error) {
        console.error('%c[ChronicleSync Summarization] Error loading model:', 'background: #ea4335; color: white; padding: 2px 4px; border-radius: 2px;', error);
        this.isInitializing = false;
        reject(error);
      }
    });

    return this.initPromise;
  }

  async summarize(text: string): Promise<string> {
    if (!this.summarizer) {
      await this.init();
    }

    if (!text || text.trim().length === 0) {
      return '';
    }

    console.log('%c[ChronicleSync Summarization] Starting summarization...', 'background: #fbbc05; color: black; padding: 2px 4px; border-radius: 2px;');
    try {
      const result = await this.summarizer(text, {
        max_length: this.maxLength,
        min_length: this.minLength,
      });
      
      console.log('%c[ChronicleSync Summarization] Completed:', 'background: #34a853; color: white; padding: 2px 4px; border-radius: 2px;', result[0].summary_text);
      return result[0].summary_text;
    } catch (error) {
      console.error('%c[ChronicleSync Summarization] Error during summarization:', 'background: #ea4335; color: white; padding: 2px 4px; border-radius: 2px;', error);
      throw error;
    }
  }
}

// Default models that can be used for summarization
export const SUMMARIZATION_MODELS = [
  {
    id: 'Xenova/distilbart-cnn-6-6',
    name: 'DistilBART CNN (Default)',
  },
  {
    id: 'Xenova/bart-large-cnn',
    name: 'BART Large CNN',
  },
  {
    id: 'Xenova/distilbart-xsum-12-6',
    name: 'DistilBART XSum',
  },
  {
    id: 'Xenova/t5-small',
    name: 'T5 Small',
  }
];

// Default model to use
export const DEFAULT_MODEL = 'Xenova/distilbart-cnn-6-6';