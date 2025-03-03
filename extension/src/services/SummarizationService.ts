import { pipeline, env } from '@xenova/transformers';

// Set environment variables
env.allowLocalModels = true;
env.useBrowserCache = true;

// Define the summarization service class
export class SummarizationService {
  private static instance: SummarizationService;
  private summarizer: any = null;
  private isLoading: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  // Private constructor for singleton pattern
  private constructor() {}

  // Get the singleton instance
  public static getInstance(): SummarizationService {
    if (!SummarizationService.instance) {
      SummarizationService.instance = new SummarizationService();
    }
    return SummarizationService.instance;
  }

  // Initialize the summarizer
  public async init(): Promise<void> {
    if (this.summarizer) {
      return;
    }

    if (this.isLoading && this.loadingPromise) {
      return this.loadingPromise;
    }

    this.isLoading = true;
    console.log('Initializing summarization model...');
    
    this.loadingPromise = new Promise<void>(async (resolve, reject) => {
      try {
        // Load the summarization pipeline
        this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        console.log('Summarization model loaded successfully');
        this.isLoading = false;
        resolve();
      } catch (error) {
        console.error('Error loading summarization model:', error);
        this.isLoading = false;
        reject(error);
      }
    });

    return this.loadingPromise;
  }

  // Generate a summary for the given text
  public async summarize(text: string): Promise<string> {
    if (!this.summarizer) {
      await this.init();
    }

    console.log('Starting summarization...');
    try {
      // Clean the text - remove extra whitespace and limit length
      const cleanedText = this.cleanText(text);
      
      // Generate summary
      const result = await this.summarizer(cleanedText, {
        max_length: 150,
        min_length: 30,
      });
      
      console.log('Summarization completed successfully');
      return result[0].summary_text;
    } catch (error) {
      console.error('Error during summarization:', error);
      throw error;
    }
  }

  // Clean the text for summarization
  private cleanText(text: string): string {
    // Remove extra whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Limit text length to 1024 tokens (approximately 4096 characters)
    // This is a rough estimate as the actual token count depends on the tokenizer
    if (cleaned.length > 4096) {
      cleaned = cleaned.substring(0, 4096);
    }
    
    return cleaned;
  }

  // Extract main content from a webpage
  public extractMainContent(document: Document): string {
    // Try to find the main content of the page
    // This is a simple heuristic and might need to be improved
    const contentSelectors = [
      'article',
      'main',
      '.content',
      '#content',
      '.post',
      '.article',
      '.entry',
    ];

    let content = '';
    
    // Try each selector
    for (const selector of contentSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        // Use the element with the most text
        let bestElement = elements[0];
        let maxLength = bestElement.textContent?.length || 0;
        
        for (let i = 1; i < elements.length; i++) {
          const length = elements[i].textContent?.length || 0;
          if (length > maxLength) {
            maxLength = length;
            bestElement = elements[i];
          }
        }
        
        content = bestElement.textContent || '';
        break;
      }
    }

    // If no content found with selectors, use the body
    if (!content) {
      // Get all paragraphs
      const paragraphs = document.querySelectorAll('p');
      content = Array.from(paragraphs)
        .map(p => p.textContent)
        .filter(Boolean)
        .join(' ');
      
      // If still no content, use the body text
      if (!content) {
        content = document.body.textContent || '';
      }
    }

    return content;
  }
}