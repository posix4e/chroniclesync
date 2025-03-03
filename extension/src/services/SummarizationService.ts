import { pipeline } from '@xenova/transformers';

// Define interfaces for our service
export interface SummaryData {
  url: string;
  title: string;
  summary: string;
  timestamp: number;
}

export class SummarizationService {
  private static instance: SummarizationService;
  private summarizer: any = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  // Make constructor private to enforce singleton pattern
  private constructor() {}

  // Get the singleton instance
  public static getInstance(): SummarizationService {
    if (!SummarizationService.instance) {
      SummarizationService.instance = new SummarizationService();
    }
    return SummarizationService.instance;
  }

  // Initialize the summarization model
  public async initialize(): Promise<void> {
    if (this.summarizer) {
      return; // Already initialized
    }

    if (this.isInitializing) {
      return this.initPromise; // Return existing initialization promise
    }

    this.isInitializing = true;
    
    // Create a promise that will resolve when initialization is complete
    this.initPromise = new Promise<void>(async (resolve, reject) => {
      try {
        console.log('Initializing summarization model...');
        
        // Try to load the primary model
        try {
          this.summarizer = await pipeline(
            'summarization',
            'Xenova/distilbart-cnn-6-6'
          );
          console.log('Primary summarization model loaded successfully');
        } catch (primaryError) {
          console.warn('Failed to load primary model, trying fallback model', primaryError);
          
          // Try to load a smaller fallback model
          try {
            this.summarizer = await pipeline(
              'summarization',
              'Xenova/distilbart-cnn-12-3'
            );
            console.log('Fallback summarization model loaded successfully');
          } catch (fallbackError) {
            console.error('Failed to load fallback model', fallbackError);
            throw new Error('Failed to load any summarization model');
          }
        }
        
        this.isInitializing = false;
        resolve();
      } catch (error) {
        this.isInitializing = false;
        console.error('Error initializing summarization model:', error);
        reject(error);
      }
    });

    return this.initPromise;
  }

  // Extract main content from a webpage
  public extractMainContent(): string {
    // Try to find the main content using common selectors
    const selectors = [
      'article',
      'main',
      '.article',
      '.post',
      '.content',
      '#content',
      '.main-content',
      '[role="main"]'
    ];

    let content = '';
    
    // Try each selector until we find content
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        // Use the first matching element with the most text content
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
        if (content.length > 500) {
          break; // Found substantial content
        }
      }
    }

    // If no content found with selectors, extract paragraphs
    if (content.length < 500) {
      const paragraphs = document.querySelectorAll('p');
      if (paragraphs.length > 0) {
        content = Array.from(paragraphs)
          .map(p => p.textContent || '')
          .filter(text => text.length > 100) // Filter out short paragraphs
          .join('\n\n');
      }
    }

    // Clean the content
    return this.cleanContent(content);
  }

  // Clean extracted content
  private cleanContent(content: string): string {
    if (!content) return '';
    
    // Remove extra whitespace
    let cleaned = content.replace(/\s+/g, ' ');
    
    // Remove common boilerplate text
    const boilerplatePatterns = [
      /cookie policy/gi,
      /privacy policy/gi,
      /terms of service/gi,
      /accept cookies/gi,
      /all rights reserved/gi,
      /copyright \d{4}/gi
    ];
    
    for (const pattern of boilerplatePatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    return cleaned.trim();
  }

  // Summarize text
  public async summarizeText(text: string): Promise<string> {
    if (!this.summarizer) {
      await this.initialize();
    }

    if (!text || text.length < 200) {
      return "Content too short to summarize.";
    }

    try {
      // Limit input length to avoid model issues
      const maxInputLength = 1024;
      const truncatedText = text.length > maxInputLength 
        ? text.substring(0, maxInputLength) 
        : text;

      const result = await this.summarizer(truncatedText, {
        max_length: 150,
        min_length: 30,
        do_sample: false
      });

      return result[0].summary_text;
    } catch (error) {
      console.error('Error during summarization:', error);
      return "Failed to generate summary.";
    }
  }

  // Generate a summary for the current page
  public async summarizePage(): Promise<SummaryData | null> {
    try {
      // Skip summarization for browser internal pages
      const url = window.location.href;
      if (url.startsWith('chrome://') || 
          url.startsWith('chrome-extension://') || 
          url.startsWith('about:') ||
          url.startsWith('edge://') ||
          url.startsWith('brave://')) {
        return null;
      }

      const content = this.extractMainContent();
      if (!content || content.length < 200) {
        return null; // Not enough content to summarize
      }

      const summary = await this.summarizeText(content);
      
      return {
        url: window.location.href,
        title: document.title,
        summary,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error summarizing page:', error);
      return null;
    }
  }
}