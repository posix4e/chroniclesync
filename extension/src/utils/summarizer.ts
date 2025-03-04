import { pipeline } from '@xenova/transformers';

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
        console.log('[ChronicleSync] Initializing summarization pipeline...');
        try {
            this.summarizationPipeline = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
            console.log('[ChronicleSync] ✓ Summarization pipeline initialized successfully');
        } catch (error) {
            console.error('[ChronicleSync] ✗ Failed to initialize summarization pipeline:', error);
            throw error;
        }
    }

    public async summarize(text: string): Promise<string> {
        console.log('[ChronicleSync] Starting text summarization...');
        
        if (!this.summarizationPipeline) {
            console.error('[ChronicleSync] ✗ Pipeline not initialized');
            throw new Error('Summarization pipeline not initialized');
        }

        try {
            console.log('[ChronicleSync] Input text length:', text.length, 'characters');
            console.log('[ChronicleSync] Processing text sample:', text.slice(0, 100) + '...');
            
            const result = await this.summarizationPipeline(text, {
                max_length: 130,
                min_length: 30,
            });
            
            const summary = result[0].summary_text;
            console.log('[ChronicleSync] ✓ Summary generated successfully');
            console.log('[ChronicleSync] Summary:', summary);
            return summary;
        } catch (error) {
            console.error('[ChronicleSync] ✗ Error during summarization:', error);
            throw error;
        }
    }
}