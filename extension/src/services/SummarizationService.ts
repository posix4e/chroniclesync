import { ContentExtractionResult, SummarizationResult, PageSummary } from '../types';

/**
 * SummarizationService - Singleton service for extracting and summarizing web page content
 * Uses the @xenova/transformers library to run summarization models in the browser
 */
export class SummarizationService {
  private static instance: SummarizationService;
  private pipeline: any = null;
  private modelLoading: boolean = false;
  private modelLoadPromise: Promise<void> | null = null;
  private readonly MODEL_NAME = 'Xenova/distilbart-cnn-6-6';
  private readonly FALLBACK_MODEL_NAME = 'Xenova/distilbart-xsum-12-3';
  private readonly MAX_INPUT_LENGTH = 1024;
  private readonly MAX_OUTPUT_LENGTH = 150;
  private readonly MODEL_LOAD_TIMEOUT = 30000; // 30 seconds

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of SummarizationService
   */
  public static getInstance(): SummarizationService {
    if (!SummarizationService.instance) {
      SummarizationService.instance = new SummarizationService();
    }
    return SummarizationService.instance;
  }

  /**
   * Initialize the summarization model
   * @param forceReload - Whether to force reload the model even if it's already loaded
   * @returns Promise that resolves when the model is loaded
   */
  public async initModel(forceReload: boolean = false): Promise<void> {
    // Return existing promise if model is already loading
    if (this.modelLoadPromise && !forceReload) {
      return this.modelLoadPromise;
    }

    // Return immediately if model is already loaded and not forcing reload
    if (this.pipeline && !forceReload) {
      return Promise.resolve();
    }

    this.modelLoading = true;
    
    // Create a promise with timeout
    this.modelLoadPromise = new Promise<void>(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Model loading timed out'));
      }, this.MODEL_LOAD_TIMEOUT);

      try {
        // Dynamically import the transformers library
        const { pipeline } = await import('@xenova/transformers');
        
        try {
          // Try to load the primary model
          this.pipeline = await pipeline('summarization', this.MODEL_NAME);
          console.log('Loaded primary summarization model:', this.MODEL_NAME);
        } catch (primaryError) {
          console.warn('Failed to load primary model, trying fallback:', primaryError);
          
          try {
            // Try to load the fallback model
            this.pipeline = await pipeline('summarization', this.FALLBACK_MODEL_NAME);
            console.log('Loaded fallback summarization model:', this.FALLBACK_MODEL_NAME);
          } catch (fallbackError) {
            throw new Error(`Failed to load both primary and fallback models: ${fallbackError}`);
          }
        }
        
        clearTimeout(timeoutId);
        resolve();
      } catch (error) {
        clearTimeout(timeoutId);
        this.pipeline = null;
        reject(error);
      } finally {
        this.modelLoading = false;
      }
    });

    return this.modelLoadPromise;
  }

  /**
   * Extract the main content from a webpage
   * @param document - The document to extract content from
   * @returns The extracted content and metadata
   */
  public extractContent(document: Document): ContentExtractionResult {
    try {
      // Try to find the main content using common selectors
      const selectors = [
        'article',
        'main',
        '.article',
        '.post',
        '.content',
        '#content',
        '.main-content',
        '[role="main"]',
        '.post-content',
        '.entry-content'
      ];

      let content = '';
      let usedSelector = '';

      // Try each selector until we find content
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Use the element with the most text content
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
          usedSelector = selector;
          break;
        }
      }

      // If no content found with selectors, try to extract paragraphs
      if (!content) {
        const paragraphs = document.querySelectorAll('p');
        if (paragraphs.length > 0) {
          // Get paragraphs with substantial content (more than 100 chars)
          const substantialParagraphs = Array.from(paragraphs)
            .filter(p => (p.textContent?.length || 0) > 100)
            .map(p => p.textContent || '')
            .join('\n\n');
          
          if (substantialParagraphs) {
            content = substantialParagraphs;
            usedSelector = 'p';
          }
        }
      }

      // If still no content, use the body as fallback
      if (!content) {
        content = document.body.textContent || '';
        usedSelector = 'body';
      }

      // Clean the content
      content = this.cleanContent(content);

      return {
        success: content.length > 0,
        content,
        selector: usedSelector
      };
    } catch (error) {
      console.error('Error extracting content:', error);
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Clean the extracted content
   * @param content - The content to clean
   * @returns The cleaned content
   */
  private cleanContent(content: string): string {
    // Remove extra whitespace
    let cleaned = content.replace(/\s+/g, ' ');
    
    // Remove common boilerplate text
    const boilerplatePatterns = [
      /accept cookies/gi,
      /cookie policy/gi,
      /privacy policy/gi,
      /terms of service/gi,
      /all rights reserved/gi,
      /copyright \d{4}/gi,
      /share this article/gi,
      /related articles/gi,
      /loading/gi,
      /advertisement/gi
    ];
    
    for (const pattern of boilerplatePatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    // Trim and normalize whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  /**
   * Summarize the given text content
   * @param content - The content to summarize
   * @returns The summarization result
   */
  public async summarizeContent(content: string): Promise<SummarizationResult> {
    try {
      // Initialize the model if not already loaded
      await this.initModel();
      
      if (!this.pipeline) {
        throw new Error('Summarization model not loaded');
      }
      
      // Truncate content if it's too long
      const truncatedContent = content.length > this.MAX_INPUT_LENGTH 
        ? content.substring(0, this.MAX_INPUT_LENGTH) 
        : content;
      
      // Generate the summary
      const result = await this.pipeline(truncatedContent, {
        max_length: this.MAX_OUTPUT_LENGTH,
        min_length: 30,
        do_sample: false
      });
      
      const summary = result[0]?.summary_text || '';
      
      return {
        success: summary.length > 0,
        summary,
        modelUsed: this.pipeline.model.config.model_type || this.MODEL_NAME
      };
    } catch (error) {
      console.error('Error summarizing content:', error);
      return {
        success: false,
        summary: '',
        error: error instanceof Error ? error.message : String(error),
        modelUsed: this.pipeline?.model.config.model_type || this.MODEL_NAME
      };
    }
  }

  /**
   * Process a webpage to extract content and generate a summary
   * @param url - The URL of the page
   * @param title - The title of the page
   * @param document - The document to process
   * @returns The page summary
   */
  public async processPage(url: string, title: string, document: Document): Promise<PageSummary | null> {
    try {
      // Extract content from the page
      const extractionResult = this.extractContent(document);
      
      if (!extractionResult.success || !extractionResult.content) {
        console.warn('Failed to extract content from page:', url);
        return null;
      }
      
      // Summarize the extracted content
      const summarizationResult = await this.summarizeContent(extractionResult.content);
      
      if (!summarizationResult.success || !summarizationResult.summary) {
        console.warn('Failed to summarize content for page:', url);
        return null;
      }
      
      // Create and return the page summary
      return {
        url,
        title,
        content: extractionResult.content,
        summary: summarizationResult.summary,
        timestamp: Date.now(),
        modelUsed: summarizationResult.modelUsed
      };
    } catch (error) {
      console.error('Error processing page:', error);
      return null;
    }
  }
}

// Export the singleton instance
export default SummarizationService.getInstance();