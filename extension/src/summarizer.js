import { pipeline } from '@xenova/transformers';

class Summarizer {
  constructor() {
    this.summarizer = null;
    this.isLoading = false;
    this.loadingPromise = null;
    this.config = null;
  }

  async init(config) {
    this.config = config;
    
    if (!this.config.enableSummarization) {
      console.log('Summarization is disabled in settings');
      return false;
    }
    
    if (this.summarizer) {
      return true;
    }
    
    if (this.isLoading) {
      return this.loadingPromise;
    }
    
    this.isLoading = true;
    
    try {
      console.log(`Loading summarization model: ${this.config.summaryModel}`);
      this.loadingPromise = pipeline('summarization', this.config.summaryModel);
      this.summarizer = await this.loadingPromise;
      console.log('Summarization model loaded successfully');
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Error loading summarization model:', error);
      this.isLoading = false;
      return false;
    }
  }

  async summarize(text) {
    if (!this.config || !this.config.enableSummarization) {
      console.log('Summarization is disabled');
      return null;
    }
    
    if (!this.summarizer && !await this.init(this.config)) {
      console.error('Failed to initialize summarizer');
      return null;
    }
    
    try {
      // Truncate text if it's too long (most models have input limits)
      const maxInputLength = 1024;
      const truncatedText = text.length > maxInputLength 
        ? text.substring(0, maxInputLength) 
        : text;
      
      console.log('Generating summary...');
      const result = await this.summarizer(truncatedText, {
        max_length: this.config.maxLength,
        min_length: this.config.minLength,
        do_sample: false
      });
      
      console.log('Summary generated:', result[0].summary_text);
      return result[0].summary_text;
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }

  // Extract main content from a webpage
  extractMainContent() {
    // Simple heuristic to extract main content
    // This could be improved with more sophisticated content extraction
    const contentElements = [
      ...document.querySelectorAll('article, main, .content, .article, .post'),
      document.body
    ];
    
    // Find the first element with substantial content
    for (const element of contentElements) {
      if (element && element.textContent && element.textContent.trim().length > 200) {
        return element.textContent.trim();
      }
    }
    
    // Fallback to body text
    return document.body.textContent.trim();
  }
}

export default Summarizer;