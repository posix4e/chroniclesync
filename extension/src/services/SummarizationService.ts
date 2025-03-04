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
  private readonly USE_ML_MODELS = false; // Always use text-based summarization to avoid WebAssembly CSP issues
  
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
    
    // Always use text-based summarization to avoid WebAssembly CSP issues
    console.log('Using text-based summarization for better compatibility');
    
    // Initialize the text-based summarizer immediately
    this.summarizer = this.createTextBasedSummarizer();
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
        console.log('Using enhanced text-based summarizer');
        
        // Split text into sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        
        if (sentences.length === 0) {
          return [{ summary_text: text.substring(0, 150) }];
        }
        
        // Score sentences based on position, length, and content
        const scoredSentences = sentences.map((sentence, index) => {
          // Clean the sentence
          const cleanSentence = sentence.trim().replace(/\s+/g, ' ');
          
          // Skip very short sentences
          if (cleanSentence.length < 30) {
            return { sentence: cleanSentence, score: 0, index };
          }
          
          // Prefer sentences from the beginning of the text (first 5 sentences get higher scores)
          const positionScore = index < 5 ? Math.max(0, 1 - (index / 5)) : 0.1;
          
          // Prefer medium-length sentences (not too short, not too long)
          const lengthScore = Math.min(1, cleanSentence.length / 100) * 
                             Math.max(0, 1 - (cleanSentence.length - 100) / 200);
          
          // Check for important keywords
          const importantKeywords = [
            'important', 'significant', 'key', 'main', 'primary', 'essential', 'critical',
            'result', 'conclusion', 'summary', 'therefore', 'thus', 'finally', 'ultimately',
            'research', 'study', 'analysis', 'data', 'evidence', 'findings'
          ];
          
          // Count how many important keywords are in the sentence
          const keywordMatches = importantKeywords.filter(keyword => 
            cleanSentence.toLowerCase().includes(keyword)
          ).length;
          
          // Calculate keyword score (more matches = higher score)
          const keywordScore = Math.min(0.5, keywordMatches * 0.1);
          
          // Check for numerical data which often indicates important information
          const hasNumbers = /\d+/.test(cleanSentence) ? 0.2 : 0;
          
          // Check for quotation marks which might indicate important statements
          const hasQuotes = /["'].*["']/.test(cleanSentence) ? 0.2 : 0;
          
          return {
            sentence: cleanSentence,
            score: positionScore * 0.4 + lengthScore * 0.2 + keywordScore * 0.2 + hasNumbers * 0.1 + hasQuotes * 0.1,
            index
          };
        });
        
        // Sort by score and take top sentences (more for longer texts)
        const sentenceCount = Math.min(4, Math.max(2, Math.floor(sentences.length / 10)));
        const topSentences = scoredSentences
          .sort((a, b) => b.score - a.score)
          .slice(0, sentenceCount);
        
        // Sort back by original position for coherent reading
        const orderedSentences = topSentences
          .sort((a, b) => a.index - b.index)
          .map(item => item.sentence);
        
        // Join sentences into a summary
        const summary = orderedSentences.join(' ');
        
        // Truncate if too long
        const finalSummary = summary.length > 300 ? summary.substring(0, 297) + '...' : summary;
        
        return [{ summary_text: finalSummary }];
      }
    };
  }
  
  /**
   * Initialize the summarization model
   */
  public async initialize(): Promise<void> {
    // If summarizer is already initialized in the constructor, just return
    if (this.summarizer) {
      return Promise.resolve();
    }
    
    // If initialization is in progress, return the existing promise
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }
    
    this.isInitializing = true;
    
    this.initPromise = new Promise<void>(async (resolve) => {
      try {
        console.log('Initializing text-based summarizer...');
        
        // Always use text-based summarization to avoid WebAssembly CSP issues
        this.summarizer = this.createTextBasedSummarizer();
        console.log('Text-based summarizer initialized successfully');
        
        this.isInitializing = false;
        resolve();
      } catch (error) {
        this.isInitializing = false;
        console.error('Failed to initialize summarizer:', error);
        
        // Create a simple fallback summarizer as a last resort
        this.summarizer = this.createTextBasedSummarizer();
        console.log('Created emergency text-based fallback summarizer');
        resolve();
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