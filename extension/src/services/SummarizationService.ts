import { pipeline, env } from '@xenova/transformers';

// Set environment variables
env.allowLocalModels = true;
env.useBrowserCache = true;
env.cacheDir = 'chroniclesync-models'; // Custom cache directory for our models

// Model options
const MODELS = {
  DEFAULT: 'Xenova/distilbart-cnn-12-3', // Smaller, faster model
  LARGE: 'Xenova/distilbart-cnn-6-6',    // Larger, more accurate model
  FALLBACK: 'Xenova/distilbart-cnn-12-3' // Fallback model
};

// Define the summarization service class
export class SummarizationService {
  private static instance: SummarizationService;
  private summarizer: any = null;
  private isLoading: boolean = false;
  private loadingPromise: Promise<void> | null = null;
  private modelName: string = MODELS.DEFAULT;

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
    console.log('%c ChronicleSync: Initializing summarization model...', 'color: #4285f4; font-weight: bold;');
    
    this.loadingPromise = new Promise<void>((resolve, reject) => {
      try {
        // Load the summarization pipeline
        console.log('ChronicleSync: Loading model', this.modelName);
        
        // Use a smaller model for faster loading
        pipeline('summarization', this.modelName)
          .then(model => {
            this.summarizer = model;
            console.log('%c ChronicleSync: Summarization model loaded successfully', 'color: green; font-weight: bold;');
            this.isLoading = false;
            resolve();
          })
          .catch(error => {
            console.error('%c ChronicleSync: Error loading summarization model:', 'color: red; font-weight: bold;', error);
            
            // If the default model fails, try the fast model as fallback
            if (this.modelName === MODELS.DEFAULT) {
              console.log('ChronicleSync: Trying fallback model...');
              this.modelName = MODELS.FAST;
              
              pipeline('summarization', this.modelName)
                .then(model => {
                  this.summarizer = model;
                  console.log('%c ChronicleSync: Fallback model loaded successfully', 'color: green; font-weight: bold;');
                  this.isLoading = false;
                  resolve();
                })
                .catch(fallbackError => {
                  console.error('%c ChronicleSync: Error loading fallback model:', 'color: red; font-weight: bold;', fallbackError);
                  this.isLoading = false;
                  reject(fallbackError);
                });
            } else {
              this.isLoading = false;
              reject(error);
            }
          });
      } catch (error) {
        console.error('%c ChronicleSync: Error in init:', 'color: red; font-weight: bold;', error);
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

    console.log('%c ChronicleSync: Starting summarization process...', 'color: #4285f4; font-weight: bold;');
    try {
      // Clean the text - remove extra whitespace and limit length
      const cleanedText = this.cleanText(text);
      console.log('ChronicleSync: Text cleaned, length:', cleanedText.length);
      
      // Generate summary
      console.log('ChronicleSync: Generating summary...');
      
      // Set timeout for summarization (30 seconds)
      const timeoutPromise = new Promise<{summary_text: string}[]>((_, reject) => {
        setTimeout(() => reject(new Error('Summarization timed out after 30 seconds')), 30000);
      });
      
      // Run summarization with timeout
      const result = await Promise.race([
        this.summarizer(cleanedText, {
          max_length: 150,
          min_length: 30,
          truncation: true,
        }),
        timeoutPromise
      ]);
      
      if (!result || !result[0] || !result[0].summary_text) {
        throw new Error('No summary generated');
      }
      
      console.log('%c ChronicleSync: Summarization completed successfully', 'color: green; font-weight: bold;');
      return result[0].summary_text;
    } catch (error) {
      console.error('%c ChronicleSync: Error during summarization:', 'color: red; font-weight: bold;', error);
      
      // Return a fallback summary if summarization fails
      return `Failed to generate summary for this page. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Clean the text for summarization
  private cleanText(text: string): string {
    // Remove extra whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Remove common boilerplate content
    cleaned = this.removeBoilerplate(cleaned);
    
    // Limit text length to 512 tokens (approximately 2048 characters)
    // This is a rough estimate as the actual token count depends on the tokenizer
    // Using a smaller limit for faster processing
    const maxLength = 2048;
    if (cleaned.length > maxLength) {
      console.log(`ChronicleSync: Text too long (${cleaned.length} chars), truncating to ${maxLength} chars`);
      cleaned = cleaned.substring(0, maxLength);
    }
    
    return cleaned;
  }
  
  // Remove common boilerplate content
  private removeBoilerplate(text: string): string {
    // List of common phrases to remove
    const boilerplatePatterns = [
      /cookie policy|privacy policy|terms of service|terms of use|all rights reserved/gi,
      /subscribe to our newsletter|sign up for our newsletter/gi,
      /copyright \d{4}|©\s*\d{4}/gi,
      /follow us on|share this|share on/gi,
      /related articles|you might also like|recommended for you/gi
    ];
    
    let cleaned = text;
    
    // Apply each pattern
    for (const pattern of boilerplatePatterns) {
      cleaned = cleaned.replace(pattern, '');
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