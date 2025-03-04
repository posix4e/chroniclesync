import { SummarizationService } from './services/SummarizationService';

class ContentScript {
  private summarizationService: SummarizationService;

  constructor() {
    this.summarizationService = SummarizationService.getInstance();
    this.init();
  }

  private async init() {
    if (this.shouldSkipPage()) return;

    try {
      await this.summarizationService.initialize();
      await this.handlePageLoad();
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  private shouldSkipPage(): boolean {
    const url = window.location.href;
    return url.startsWith('chrome://') || 
           url.startsWith('about:') || 
           url.startsWith('chrome-extension://');
  }

  private async handlePageLoad() {
    if (document.readyState === 'complete') {
      await this.processSummarization();
    } else {
      window.addEventListener('load', () => this.processSummarization());
    }
  }

  private async processSummarization() {
    try {
      const content = await this.summarizationService.extractContent(document);
      if (!content) return;

      const summary = await this.summarizationService.summarize(content);
      
      chrome.runtime.sendMessage({
        type: 'SAVE_SUMMARY',
        payload: {
          url: window.location.href,
          summary
        }
      });
    } catch (error) {
      console.error('Failed to process summarization:', error);
    }
  }
}

new ContentScript();