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

  private constructor() {}

  public static getInstance(): SummarizationService {
    if (!SummarizationService.instance) {
      SummarizationService.instance = new SummarizationService();
    }
    return SummarizationService.instance;
  }

  public async init(modelName: string, debugMode: boolean = false): Promise<void> {
    if (this.summarizer && this.modelName === modelName) {
      return;
    }

    if (this.isInitializing) {
      return this.initPromise;
    }

    this.modelName = modelName;
    this.debugMode = debugMode;
    this.isInitializing = true;

    this.initPromise = new Promise<void>(async (resolve) => {
      try {
        if (this.debugMode) {
          console.log(`Initializing summarization model: ${this.modelName}`);
        }
        this.summarizer = await pipeline('summarization', this.modelName);
        if (this.debugMode) {
          console.log('Summarization model loaded successfully');
        }
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
    if (!this.summarizer) {
      if (this.debugMode) {
        console.log('Summarizer not initialized, initializing now...');
      }
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
        if (this.debugMode) {
          console.log('Text too short for summarization, returning null');
        }
        return null;
      }

      if (this.debugMode) {
        console.log('Generating summary for text:', cleanedText.substring(0, 100) + '...');
      }

      const result = await this.summarizer(cleanedText, {
        max_length: maxLength,
        min_length: 30,
        do_sample: false
      });

      const summary = result[0]?.summary_text;
      
      if (this.debugMode && summary) {
        console.log('Generated summary:', summary);
      }
      
      return summary || null;
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }

  public async extractMainContent(html: string): Promise<string> {
    try {
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove script, style, nav, header, footer, and other non-content elements
      const elementsToRemove = [
        'script', 'style', 'nav', 'header', 'footer', 'aside', 
        'iframe', 'noscript', 'svg', 'form', 'button', 'input'
      ];
      
      elementsToRemove.forEach(tag => {
        const elements = doc.getElementsByTagName(tag);
        for (let i = elements.length - 1; i >= 0; i--) {
          elements[i].parentNode?.removeChild(elements[i]);
        }
      });

      // Try to find the main content
      let mainContent = '';
      
      // First try to find article or main elements
      const contentElements = doc.querySelectorAll('article, main, [role="main"], .content, #content, .main, #main');
      
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
      } else {
        // Fallback to body content
        mainContent = doc.body.textContent || '';
      }

      return mainContent.trim();
    } catch (error) {
      console.error('Error extracting main content:', error);
      return '';
    }
  }
}