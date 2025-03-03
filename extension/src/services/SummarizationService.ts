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
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Configure the library to use the Hugging Face Hub
    env.allowLocalModels = false; // Force remote models
    env.useBrowserCache = true;
    env.cacheDir = ''; // Use default cache directory
    
    // Force remote loading
    env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
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
          setTimeout(() => reject(new Error('Model loading timed out')), this.TIMEOUT_MS);
        });
        
        // Create a simple extractive summarizer as an immediate fallback
        this.summarizer = {
          extractiveSummarize: (text: string) => {
            try {
              // Split into sentences
              const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
              
              // For short texts, just return the first few sentences
              if (sentences.length <= 3) {
                return { summary_text: sentences.join(' ') };
              }
              
              // For longer texts, select important sentences
              // Simple heuristic: first sentence + sentences with important keywords
              const importantKeywords = ['important', 'significant', 'crucial', 'essential', 'key', 'main', 'primary', 'critical'];
              const keywordSentences = sentences.filter(s => 
                importantKeywords.some(keyword => s.toLowerCase().includes(keyword))
              );
              
              // Combine first sentence with keyword sentences, or just take first few if none found
              const selectedSentences = [sentences[0]];
              if (keywordSentences.length > 0) {
                selectedSentences.push(...keywordSentences.slice(0, 2));
              } else {
                selectedSentences.push(...sentences.slice(1, 3));
              }
              
              return { summary_text: selectedSentences.join(' ') };
            } catch (error) {
              console.error('Extractive summarization failed:', error);
              return { summary_text: text.substring(0, 200) + '...' };
            }
          }
        };
        
        // Try to load the real model in the background
        Promise.race([
          pipeline('summarization', this.TINY_MODEL, { 
            quantized: false,
            progress_callback: (progress: number) => {
              console.log(`Model loading progress: ${(progress * 100).toFixed(0)}%`);
            }
          }),
          timeoutPromise
        ]).then(model => {
          console.log('Tiny summarization model loaded successfully');
          this.summarizer = model;
        }).catch(error => {
          console.warn(`Failed to load tiny model: ${error}. Trying small model...`);
          
          // Try small model
          Promise.race([
            pipeline('summarization', this.SMALL_MODEL, { 
              quantized: false,
              progress_callback: (progress: number) => {
                console.log(`Small model loading progress: ${(progress * 100).toFixed(0)}%`);
              }
            }),
            timeoutPromise
          ]).then(model => {
            console.log('Small summarization model loaded successfully');
            this.summarizer = model;
          }).catch(smallError => {
            console.warn(`Failed to load small model: ${smallError}. Trying fallback model...`);
            
            // Try fallback model
            Promise.race([
              pipeline('summarization', this.FALLBACK_MODEL, { 
                quantized: false,
                progress_callback: (progress: number) => {
                  console.log(`Fallback model loading progress: ${(progress * 100).toFixed(0)}%`);
                }
              }),
              timeoutPromise
            ]).then(model => {
              console.log('Fallback summarization model loaded successfully');
              this.summarizer = model;
            }).catch(fallbackError => {
              console.warn(`Failed to load fallback model: ${fallbackError}. Using extractive summarization.`);
              // Keep using the extractive summarizer
            });
          });
        });
        
        // Resolve immediately with the extractive summarizer
        this.isInitializing = false;
        resolve();
      } catch (error) {
        this.isInitializing = false;
        console.error('Failed to initialize summarization:', error);
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
      let result;
      
      // Check if we're using the extractive summarizer
      if (this.summarizer.extractiveSummarize) {
        result = this.summarizer.extractiveSummarize(truncatedContent);
      } else {
        // Using the ML model
        result = await this.summarizer(truncatedContent, {
          max_length: 150,
          min_length: 30,
          do_sample: false,
          truncation: true
        });
        
        // Handle array result from ML model
        if (Array.isArray(result) && result.length > 0) {
          result = result[0];
        }
      }
      
      if (!result || !result.summary_text) {
        throw new Error('Model returned invalid summary');
      }
      
      return result.summary_text;
    } catch (error) {
      console.error('Error during summarization:', error);
      
      // Fallback to simple extractive summarization
      try {
        const sentences = truncatedContent.match(/[^.!?]+[.!?]+/g) || [];
        
        if (sentences.length === 0) {
          return truncatedContent.substring(0, 200) + '...';
        }
        
        const firstSentence = sentences[0];
        if (sentences.length <= 2) {
          return sentences.join(' ');
        }
        
        // Take first sentence and one or two more
        return [firstSentence, sentences[1], sentences.length > 2 ? sentences[2] : ''].filter(Boolean).join(' ');
      } catch (fallbackError) {
        console.error('Fallback summarization failed:', fallbackError);
        return truncatedContent.substring(0, 200) + '...';
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