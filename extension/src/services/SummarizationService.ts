import { pipeline, env } from '@xenova/transformers';

// Set environment variables
env.allowLocalModels = false;
env.useBrowserCache = true;

export class SummarizationService {
  private static instance: SummarizationService;
  private summarizer: any = null;
  private modelName: string = 'Xenova/distilbart-cnn-6-6';
  private isInitializing: boolean = false;
  private initPromise: Promise<void> = Promise.resolve();
  private debugMode: boolean = false;

  private constructor() {
    console.log('SummarizationService constructor called');
  }

  public static getInstance(): SummarizationService {
    console.log('SummarizationService.getInstance called');
    if (!SummarizationService.instance) {
      console.log('Creating new SummarizationService instance');
      SummarizationService.instance = new SummarizationService();
    } else {
      console.log('Returning existing SummarizationService instance');
    }
    return SummarizationService.instance;
  }

  public async init(modelName: string, debugMode: boolean = false): Promise<void> {
    // Always log this regardless of debug mode to help with troubleshooting
    console.log(`SummarizationService.init called with model: ${modelName}, debugMode: ${debugMode}`);
    
    if (this.summarizer && this.modelName === modelName) {
      console.log('Summarizer already initialized with the same model, reusing');
      return;
    }

    if (this.isInitializing) {
      console.log('Summarizer initialization already in progress, waiting...');
      return this.initPromise;
    }

    this.modelName = modelName;
    this.debugMode = debugMode;
    this.isInitializing = true;

    this.initPromise = new Promise<void>(async (resolve) => {
      try {
        console.log(`Initializing summarization model: ${this.modelName}`);
        
        // Load the pipeline
        this.summarizer = await pipeline('summarization', this.modelName);
        console.log('Summarization model loaded successfully');
      } catch (error) {
        console.error('Error initializing summarization model:', error);
      } finally {
        this.isInitializing = false;
        resolve();
      }
    });

    return this.initPromise;
  }

  public async summarize(text: string, maxLength: number = 150): Promise<string | null> {
    // Always log this for troubleshooting
    console.log(`SummarizationService.summarize called, text length: ${text.length}, debugMode: ${this.debugMode}`);
    
    if (!this.summarizer) {
      console.log('Summarizer not initialized, initializing now...');
      await this.init(this.modelName, this.debugMode);
    }

    if (!this.summarizer) {
      console.error('Failed to initialize summarizer');
      return null;
    }

    try {
      // Clean the text - remove extra whitespace, etc.
      const cleanedText = text
        .replace(/\s+/g, ' ')
        .trim();

      // Skip summarization for very short texts
      if (cleanedText.length < 200) {
        console.log(`Text too short for summarization (${cleanedText.length} chars), returning null`);
        return null;
      }

      console.log('Generating summary for text:', cleanedText.substring(0, 100) + '...');
      console.log(`Text length after cleaning: ${cleanedText.length} chars`);

      const result = await this.summarizer(cleanedText, {
        max_length: maxLength,
        min_length: 30,
        do_sample: false
      });

      const summary = result[0]?.summary_text;
      
      if (summary) {
        console.log('Generated summary:', summary);
      } else {
        console.log('No summary was generated');
      }
      
      return summary || null;
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }

  public async extractMainContent(html: string): Promise<string> {
    console.log(`SummarizationService.extractMainContent called, HTML length: ${html.length}`);
    
    try {
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      console.log('HTML parsed successfully');

      // Remove script, style, nav, header, footer, and other non-content elements
      const elementsToRemove = [
        'script', 'style', 'nav', 'header', 'footer', 'aside', 
        'iframe', 'noscript', 'svg', 'form', 'button', 'input'
      ];
      
      let removedCount = 0;
      elementsToRemove.forEach(tag => {
        const elements = doc.getElementsByTagName(tag);
        const count = elements.length;
        for (let i = elements.length - 1; i >= 0; i--) {
          elements[i].parentNode?.removeChild(elements[i]);
        }
        removedCount += count;
      });
      
      console.log(`Removed ${removedCount} non-content elements`);

      // Try to find the main content
      let mainContent = '';
      
      // First try to find article or main elements
      const contentElements = doc.querySelectorAll('article, main, [role="main"], .content, #content, .main, #main');
      console.log(`Found ${contentElements.length} potential content elements`);
      
      if (contentElements.length > 0) {
        // Use the largest content element
        let largestElement = contentElements[0];
        let largestLength = contentElements[0].textContent?.length || 0;
        
        for (let i = 1; i < contentElements.length; i++) {
          const length = contentElements[i].textContent?.length || 0;
          if (length > largestLength) {
            largestElement = contentElements[i];
            largestLength = length;
          }
        }
        
        mainContent = largestElement.textContent || '';
        console.log(`Using largest content element with ${largestLength} characters`);
      } else {
        // Fallback to body content
        mainContent = doc.body.textContent || '';
        console.log(`No content elements found, using body text (${mainContent.length} characters)`);
      }

      const trimmedContent = mainContent.trim();
      console.log(`Extracted content length: ${trimmedContent.length} characters`);
      
      if (trimmedContent.length > 0) {
        console.log('Content preview:', trimmedContent.substring(0, 100) + '...');
      } else {
        console.log('No content extracted');
      }
      
      return trimmedContent;
    } catch (error) {
      console.error('Error extracting main content:', error);
      return '';
    }
  }
}