import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js settings
env.useBrowserCache = true;
env.allowLocalModels = false;
env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('onnx/');

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

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

    private async initialize(retryCount = 0) {
        try {
            console.log('Initializing summarization pipeline...');
            
            // Check if WASM backend is available
            if (!env.backends.onnx.wasm.wasmPaths) {
                throw new Error('WASM backend not configured');
            }

            // Initialize the pipeline with a smaller model for better performance
            this.summarizationPipeline = await pipeline('summarization', 'Xenova/distilbart-cnn-12-6', {
                quantized: true,
                progress_callback: (progress: any) => {
                    console.log('Loading model:', Math.round(progress.progress * 100), '%');
                }
            });
            
            console.log('Summarization pipeline initialized successfully');
        } catch (error) {
            console.error('Error initializing pipeline:', error);
            
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying initialization (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return this.initialize(retryCount + 1);
            }
            
            throw new Error(`Failed to initialize summarization pipeline after ${MAX_RETRIES} attempts: ${error.message}`);
        }
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