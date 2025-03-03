import { PageContent, PageSummary } from '../types';
import { pipeline, env } from '@xenova/transformers';

/**
 * Service for local page summarization using ML models
 */
export class SummarizationService {
  private static instance: SummarizationService;
  private summarizer: any = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private readonly MAX_INPUT_LENGTH = 4096;
  private readonly MIN_CONTENT_LENGTH = 200;
  private readonly MODEL_NAME = 'Xenova/distilbart-cnn-6-6';
  private readonly FALLBACK_MODEL = 'Xenova/distilbart-xsum-12-3';
  private readonly SMALL_MODEL = 'Xenova/distilbart-cnn-6-6-fp16';
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Configure the library to use the Hugging Face Hub
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    env.cacheDir = '';
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
   */
  public async initialize(): Promise<void> {
    if (this.summarizer) {
      return Promise.resolve();
    }
    
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }
    
    this.isInitializing = true;
    
    this.initPromise = new Promise<void>(async (resolve, reject) => {
      try {
        console.log('Initializing summarization model...');
        
        // Set a timeout for model loading
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Model loading timed out')), 60000);
        });
        
        // Try to load the small model first (faster to download)
        try {
          this.summarizer = await Promise.race([
            pipeline('summarization', this.SMALL_MODEL, { quantized: false }),
            timeoutPromise
          ]);
          console.log('Small summarization model loaded successfully');
        } catch (error) {
          console.warn(`Failed to load small model: ${error}. Trying primary model...`);
          
          // Try to load the primary model
          try {
            this.summarizer = await Promise.race([
              pipeline('summarization', this.MODEL_NAME, { quantized: false }),
              timeoutPromise
            ]);
            console.log('Primary summarization model loaded successfully');
          } catch (primaryError) {
            console.warn(`Failed to load primary model: ${primaryError}. Trying fallback model...`);
            
            // Try to load the fallback model
            try {
              this.summarizer = await Promise.race([
                pipeline('summarization', this.FALLBACK_MODEL, { quantized: false }),
                timeoutPromise
              ]);
              console.log('Fallback summarization model loaded successfully');
            } catch (fallbackError) {
              throw new Error(`Failed to load fallback model: ${fallbackError}`);
            }
          }
        }
        
        this.isInitializing = false;
        resolve();
      } catch (error) {
        this.isInitializing = false;
        console.error('Failed to initialize summarization model:', error);
        reject(error);
      }
    });
    
    return this.initPromise;
  }
  
  /**
   * Extract main content from a webpage
   * @param document The document to extract content from
   * @returns The extracted content
   */
  public extractContent(document: Document): string {
    // Try common content selectors
    const selectors = [
      'article', 'main', '.content', '.article', '.post', 
      '[role="main"]', '#content', '#main'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.trim().length > this.MIN_CONTENT_LENGTH) {
        return this.cleanText(element.textContent);
      }
    }
    
    // Fallback to paragraphs
    const paragraphs = Array.from(document.querySelectorAll('p'));
    if (paragraphs.length > 0) {
      const paragraphText = paragraphs
        .filter(p => p.textContent && p.textContent.trim().length > 40)
        .map(p => {
          const text = p.textContent;
          return text ? text.trim() : '';
        })
        .join('\n\n');
      
      if (paragraphText.length > this.MIN_CONTENT_LENGTH) {
        return this.cleanText(paragraphText);
      }
    }
    
    // Last resort: body text
    return this.cleanText(document.body.textContent || '');
  }
  
  /**
   * Clean and preprocess text for summarization
   * @param text The text to clean
   * @returns The cleaned text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')                // Normalize whitespace
      .replace(/\n\s*\n/g, '\n')           // Remove multiple newlines
      .replace(/\t/g, ' ')                 // Replace tabs with spaces
      .replace(/\s+([.,;:!?])/g, '$1')     // Remove spaces before punctuation
      .trim();
  }
  
  /**
   * Summarize text using the loaded model
   * @param content The content to summarize
   * @returns A promise that resolves to the summary
   */
  public async summarize(content: string): Promise<string> {
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content provided');
    }
    
    const trimmedContent = content.trim();
    
    // For very short content, just return it as is
    if (trimmedContent.length < 100) {
      return trimmedContent;
    }
    
    // For moderately short content, create a simple summary
    if (trimmedContent.length < this.MIN_CONTENT_LENGTH) {
      const sentences = trimmedContent.match(/[^.!?]+[.!?]+/g) || [];
      return sentences.slice(0, 2).join(' ');
    }
    
    await this.initialize();
    
    if (!this.summarizer) {
      throw new Error('Summarization model not initialized');
    }
    
    // Truncate content if it's too long
    const truncatedContent = trimmedContent.length > this.MAX_INPUT_LENGTH 
      ? trimmedContent.substring(0, this.MAX_INPUT_LENGTH) 
      : trimmedContent;
    
    try {
      const result = await this.summarizer(truncatedContent, {
        max_length: 150,
        min_length: 30,
        do_sample: false,
        truncation: true
      });
      
      if (!result || !result[0] || !result[0].summary_text) {
        throw new Error('Model returned invalid summary');
      }
      
      return result[0].summary_text;
    } catch (error) {
      console.error('Error during summarization:', error);
      
      // Fallback to extractive summarization
      try {
        const sentences = truncatedContent.match(/[^.!?]+[.!?]+/g) || [];
        const importantSentences = sentences
          .filter(s => s.length > 40)
          .slice(0, 3);
        
        if (importantSentences.length > 0) {
          return importantSentences.join(' ');
        } else {
          return sentences.slice(0, 3).join(' ');
        }
      } catch (fallbackError) {
        console.error('Fallback summarization failed:', fallbackError);
        throw new Error(`Summarization failed: ${error}`);
      }
    }
  }
  
  /**
   * Process a page for summarization
   * @param pageContent The page content to summarize
   * @returns A promise that resolves to the page summary
   */
  public async processPage(pageContent: PageContent): Promise<PageSummary> {
    try {
      // Validate input
      if (!pageContent || !pageContent.url || !pageContent.content) {
        throw new Error('Invalid page content provided');
      }
      
      // Clean the content
      const cleanedContent = this.cleanText(pageContent.content);
      
      // Generate summary
      let summary: string;
      try {
        summary = await this.summarize(cleanedContent);
      } catch (summaryError) {
        console.warn('Summarization failed, using fallback:', summaryError);
        // Fallback to first paragraph if summarization fails
        const firstParagraph = cleanedContent.split('\n\n')[0];
        summary = firstParagraph.length > 150 
          ? firstParagraph.substring(0, 150) + '...' 
          : firstParagraph;
      }
      
      return {
        url: pageContent.url,
        title: pageContent.title || 'Untitled Page',
        summary,
        timestamp: Date.now(),
        contentLength: cleanedContent.length
      };
    } catch (error) {
      console.error('Error processing page:', error);
      throw error;
    }
  }
}