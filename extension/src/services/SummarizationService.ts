import { pipeline } from '@xenova/transformers';

export class SummarizationService {
    private static instance: SummarizationService;
    private summarizer: any = null;
    private isInitializing = false;
    private initPromise: Promise<void> | null = null;

    private constructor() {}

    public static getInstance(): SummarizationService {
        if (!SummarizationService.instance) {
            SummarizationService.instance = new SummarizationService();
        }
        return SummarizationService.instance;
    }

    private async initializeSummarizer(): Promise<void> {
        if (this.summarizer || this.isInitializing) {
            return;
        }

        this.isInitializing = true;
        try {
            this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        } catch (error) {
            console.error('Failed to initialize summarizer:', error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    public async summarize(text: string): Promise<string> {
        if (!this.summarizer && !this.initPromise) {
            this.initPromise = this.initializeSummarizer();
        }
        await this.initPromise;

        try {
            const result = await this.summarizer(text, {
                max_length: 150,
                min_length: 40,
                do_sample: false
            });
            return result[0].summary_text;
        } catch (error) {
            console.error('Summarization failed:', error);
            throw error;
        }
    }

    public extractMainContent(document: Document): string {
        const selectors = [
            'article',
            'main',
            '[role="main"]',
            '.content',
            '.article',
            '.post-content'
        ];

        let content = '';
        
        // Try to find content using selectors
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                content = element.textContent || '';
                break;
            }
        }

        // Fallback to paragraph analysis
        if (!content) {
            const paragraphs = document.getElementsByTagName('p');
            content = Array.from(paragraphs)
                .map(p => p.textContent || '')
                .join('\n');
        }

        return this.cleanContent(content);
    }

    private cleanContent(text: string): string {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*/g, '\n')
            .trim();
    }
}