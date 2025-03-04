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
  // Use smaller, more efficient models
  private readonly TINY_MODEL = 'Xenova/distilbart-cnn-6-6-fp16'; // Smallest model
  private readonly SMALL_MODEL = 'Xenova/distilbart-cnn-6-6';
  private readonly FALLBACK_MODEL = 'Xenova/distilbart-xsum-12-3';
  private readonly TIMEOUT_MS = 120000; // Increase timeout to 2 minutes
  private readonly USE_ML_MODELS = false; // Set to false to use only text-based summarization
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Configure the library to use the Hugging Face Hub
    env.allowLocalModels = true; // Allow local models
    env.useBrowserCache = true;
    env.cacheDir = ''; // Use default cache directory
    env.localModelPath = './models'; // Set local model path
    
    // Check if we're in a service worker context (background script)
    const isServiceWorker = typeof self !== 'undefined' && !('document' in self);
    
    // Disable ML models in service worker context due to CSP restrictions
    if (isServiceWorker) {
      console.log('Running in service worker context, using text-based summarization only');
    }
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
   * Create a text-based summarizer that doesn't use ML
   */
  private createTextBasedSummarizer(): any {
    return {
      async __call__(text: string) {
        console.log('Using text-based summarizer');
        
        // Split text into sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        
        if (sentences.length === 0) {
          return [{ summary_text: text.substring(0, 150) }];
        }
        
        // Score sentences based on position and length
        const scoredSentences = sentences.map((sentence, index) => {
          // Prefer sentences from the beginning of the text
          const positionScore = Math.max(0, 1 - (index / Math.min(10, sentences.length)));
          
          // Prefer medium-length sentences (not too short, not too long)
          const lengthScore = Math.min(1, sentence.length / 100) * Math.max(0, 1 - (sentence.length - 100) / 200);
          
          // Check for important keywords
          const keywordScore = ['important', 'significant', 'key', 'main', 'primary', 'essential', 'critical']
            .some(keyword => sentence.toLowerCase().includes(keyword)) ? 0.3 : 0;
          
          return {
            sentence,
            score: positionScore * 0.6 + lengthScore * 0.3 + keywordScore,
            index
          };
        });
        
        // Sort by score and take top 3 sentences
        const topSentences = scoredSentences
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        
        // Sort back by original position
        const orderedSentences = topSentences
          .sort((a, b) => a.index - b.index)
          .map(item => item.sentence);
        
        // Join sentences into a summary
        const summary = orderedSentences.join(' ');
        
        return [{ summary_text: summary }];
      }
    };
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
        
        // Check if we should skip ML models and use text-based summarization only
        if (!this.USE_ML_MODELS) {
          console.log('ML models disabled, using text-based summarization');
          this.summarizer = this.createTextBasedSummarizer();
          this.isInitializing = false;
          resolve();
          return;
        }
        
        // Set a timeout for model loading
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Model loading timed out')), this.TIMEOUT_MS);
        });
        
        // Try to load the tiny model first (fastest to download)
        try {
          console.log('Attempting to load tiny model...');
          this.summarizer = await Promise.race([
            pipeline('summarization', this.TINY_MODEL, { 
              quantized: true, // Use quantized model for smaller size
              progress_callback: (progress: number) => {
                console.log(`Model loading progress: ${Math.round(progress * 100)}%`);
              }
            }),
            timeoutPromise
          ]);
          console.log('Tiny summarization model loaded successfully');
        } catch (error) {
          console.warn(`Failed to load tiny model: ${error}. Trying small model...`);
          
          // Try to load the small model
          try {
            console.log('Attempting to load small model...');
            this.summarizer = await Promise.race([
              pipeline('summarization', this.SMALL_MODEL, { 
                quantized: true,
                progress_callback: (progress: number) => {
                  console.log(`Model loading progress: ${Math.round(progress * 100)}%`);
                }
              }),
              timeoutPromise
            ]);
            console.log('Small summarization model loaded successfully');
          } catch (smallError) {
            console.warn(`Failed to load small model: ${smallError}. Trying fallback model...`);
            
            // Try to load the fallback model
            try {
              console.log('Attempting to load fallback model...');
              this.summarizer = await Promise.race([
                pipeline('summarization', this.FALLBACK_MODEL, { 
                  quantized: true,
                  progress_callback: (progress: number) => {
                    console.log(`Model loading progress: ${Math.round(progress * 100)}%`);
                  }
                }),
                timeoutPromise
              ]);
              console.log('Fallback summarization model loaded successfully');
            } catch (fallbackError) {
              console.error('All model loading attempts failed');
              
              // Create a simple fallback summarizer that doesn't use ML
              this.summarizer = this.createTextBasedSummarizer();
              console.log('Created text-based fallback summarizer');
              resolve(); // Resolve with the fallback summarizer
              return;
            }
          }
        }
        
        this.isInitializing = false;
        resolve();
      } catch (error) {
        this.isInitializing = false;
        console.error('Failed to initialize summarization model:', error);
        
        // Create a simple fallback summarizer that doesn't use ML
        this.summarizer = this.createTextBasedSummarizer();
        console.log('Created emergency text-based fallback summarizer');
        resolve(); // Resolve with the fallback summarizer
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