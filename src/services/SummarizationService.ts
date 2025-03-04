export class SummarizationService {
  private static importTransformers = async () => {
    const { pipeline } = await import('@xenova/transformers');
    return pipeline;
  };
  private static instance: SummarizationService;
  private summarizer: any;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SummarizationService {
    if (!SummarizationService.instance) {
      SummarizationService.instance = new SummarizationService();
    }
    return SummarizationService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const pipeline = await SummarizationService.importTransformers();
      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize summarizer:', error);
      throw error;
    }
  }

  public async extractContent(document: Document): Promise<string> {
    const selectors = [
      'article',
      'main',
      '.content',
      '[role="main"]',
      '#main-content'
    ];

    let content = '';
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.textContent || '';
        break;
      }
    }

    if (!content) {
      const paragraphs = Array.from(document.getElementsByTagName('p'))
        .map(p => p.textContent)
        .filter(text => text && text.length > 100)
        .join('\n');
      content = paragraphs;
    }

    return this.cleanContent(content);
  }

  private cleanContent(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  public async summarize(text: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.summarizer(text, {
        max_length: 150,
        min_length: 30,
        do_sample: false
      });

      return result[0].summary_text;
    } catch (error) {
      console.error('Summarization failed:', error);
      throw error;
    }
  }
}