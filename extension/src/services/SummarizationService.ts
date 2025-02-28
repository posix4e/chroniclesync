import { pipeline } from '@xenova/transformers';

export class SummarizationService {
  private static instance: SummarizationService;
  private summarizer: any = null;
  private isInitializing = false;
  private modelName = 'Xenova/distilbart-cnn-6-6';
  private debugMode = false;

  private constructor() {}

  public static getInstance(): SummarizationService {
    if (!SummarizationService.instance) {
      SummarizationService.instance = new SummarizationService();
    }
    return SummarizationService.instance;
  }

  public async setModel(modelName: string): Promise<void> {
    if (this.modelName !== modelName) {
      this.modelName = modelName;
      this.summarizer = null;
      this.isInitializing = false;
    }
  }

  public setDebugMode(debug: boolean): void {
    this.debugMode = debug;
  }

  private async initializeSummarizer(): Promise<void> {
    if (this.summarizer !== null || this.isInitializing) {
      return;
    }

    try {
      this.isInitializing = true;
      this.summarizer = await pipeline('summarization', this.modelName);
      this.isInitializing = false;
      
      if (this.debugMode) {
        console.log(`Summarizer initialized with model: ${this.modelName}`);
      }
    } catch (error) {
      this.isInitializing = false;
      console.error('Failed to initialize summarizer:', error);
      throw error;
    }
  }

  public async summarizeText(text: string, maxLength: number = 150): Promise<string> {
    if (!text || text.trim().length === 0) {
      return '';
    }

    try {
      await this.initializeSummarizer();
      
      // Clean the text - remove extra whitespace, etc.
      const cleanedText = text
        .replace(/\s+/g, ' ')
        .trim();
      
      // If text is too short, don't summarize
      if (cleanedText.length < 200) {
        return cleanedText;
      }

      const result = await this.summarizer(cleanedText, {
        max_length: maxLength,
        min_length: 30,
        do_sample: false
      });

      const summary = result[0].summary_text;
      
      if (this.debugMode) {
        console.log('Original text length:', cleanedText.length);
        console.log('Summary:', summary);
      }
      
      return summary;
    } catch (error) {
      console.error('Error summarizing text:', error);
      return '';
    }
  }

  public async extractMainContent(html: string): Promise<string> {
    try {
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Remove script, style, nav, header, footer elements
      const elementsToRemove = [
        'script', 'style', 'nav', 'header', 'footer', 
        'aside', 'iframe', 'noscript', 'svg', 'form'
      ];
      
      elementsToRemove.forEach(tag => {
        const elements = doc.getElementsByTagName(tag);
        for (let i = elements.length - 1; i >= 0; i--) {
          elements[i].parentNode?.removeChild(elements[i]);
        }
      });
      
      // Try to find main content
      let mainContent = '';
      
      // First try to get content from main, article, or section tags
      const contentElements = doc.querySelectorAll('main, article, .content, .main, #content, #main');
      if (contentElements.length > 0) {
        // Use the largest content element
        let largestElement = contentElements[0];
        let maxLength = largestElement.textContent?.length || 0;
        
        for (let i = 1; i < contentElements.length; i++) {
          const length = contentElements[i].textContent?.length || 0;
          if (length > maxLength) {
            maxLength = length;
            largestElement = contentElements[i];
          }
        }
        
        mainContent = largestElement.textContent || '';
      } else {
        // Fallback to body content
        mainContent = doc.body.textContent || '';
      }
      
      return mainContent;
    } catch (error) {
      console.error('Error extracting main content:', error);
      return '';
    }
  }
}