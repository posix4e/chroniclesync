import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js to use CDN for models
env.useBrowserCache = true; // Enable caching to avoid re-downloading
env.allowLocalModels = false; // Use remote models
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

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
        console.log('Initializing summarization pipeline...');
        this.summarizationPipeline = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        console.log('Summarization pipeline initialized');
    }

    public async summarize(text: string): Promise<string> {
        console.log('Starting summarization...');
        console.log('Input text:', text);
        
        if (!this.summarizationPipeline) {
            throw new Error('Summarization pipeline not initialized');
        }

        try {
            const result = await this.summarizationPipeline(text, {
                max_length: 130,
                min_length: 30,
            });
            
            console.log('Summarization output:', result[0].summary_text);
            console.log('Summarization complete');
            return result[0].summary_text;
        } catch (error) {
            console.error('Error during summarization:', error);
            throw error;
        }
    }
}