import { pipeline } from '@xenova/transformers';
import { Logger } from './logger';

export class Summarizer {
    private static instance: Summarizer | null = null;
    private summarizationPipeline: any = null;

    private constructor() {}

    public static async getInstance(): Promise<Summarizer> {
        if (!Summarizer.instance) {
            Summarizer.instance = new Summarizer();
            await Summarizer.instance.initialize();
        }
        return Summarizer.instance;
    }

    private async initialize() {
        const logger = Logger.getInstance();
        logger.info('Initializing summarization pipeline...');
        try {
            this.summarizationPipeline = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
            logger.success('Summarization pipeline initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize summarization pipeline', error);
            throw error;
        }
    }

    public async summarize(text: string): Promise<string> {
        const logger = Logger.getInstance();
        logger.info('Starting text summarization...');
        
        if (!this.summarizationPipeline) {
            logger.error('Pipeline not initialized');
            throw new Error('Summarization pipeline not initialized');
        }

        try {
            logger.info(`Input text length: ${text.length} characters`);
            logger.info(`Processing text sample: ${text.slice(0, 100)}...`);
            
            const result = await this.summarizationPipeline(text, {
                max_length: 130,
                min_length: 30,
            });
            
            const summary = result[0].summary_text;
            logger.success('Summary generated successfully');
            logger.info(`Summary: ${summary}`);
            return summary;
        } catch (error) {
            logger.error('Error during summarization', error);
            throw error;
        }
    }
}