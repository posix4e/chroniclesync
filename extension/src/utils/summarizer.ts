import { pipeline, env, SummarizationPipeline } from '@xenova/transformers';

// Configure transformers.js settings
env.useBrowserCache = true;
env.allowLocalModels = false;

// Set up WASM paths
const wasmDir = chrome.runtime.getURL('onnx/');
env.backends.onnx.wasm.wasmPaths = wasmDir;

// Log configuration for debugging
console.log('WASM paths configured:', {
    wasmDir,
    useBrowserCache: env.useBrowserCache,
    allowLocalModels: env.allowLocalModels
});

// Use a smaller model and set timeouts
const MODEL_NAME = 'Xenova/bart-small-cnn';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const LOAD_TIMEOUT = 60000; // 60 seconds timeout for first load

// Helper function to add timeout to a promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
}

export class Summarizer {
    private static instance: Summarizer | null = null;
    private summarizationPipeline: SummarizationPipeline | null = null;

    private constructor() {}

    public static async getInstance(): Promise<Summarizer> {
        if (!Summarizer.instance) {
            Summarizer.instance = new Summarizer();
            await Summarizer.instance.initialize();
        }
        return Summarizer.instance;
    }

    private async initialize(retryCount = 0): Promise<void> {
        try {
            console.log('Initializing summarization pipeline...');
            
            // Check if WASM backend is available
            if (!env.backends.onnx.wasm.wasmPaths) {
                throw new Error('WASM backend not configured');
            }

            console.log('Loading summarization model (this may take a while on first run)...');
            const initPromise = pipeline('summarization', MODEL_NAME, {
                quantized: true,
                progress_callback: (progress: { progress: number }) => {
                    console.log(`Model loading progress: ${Math.round(progress.progress * 100)}%`);
                }
            });

            // Add timeout to pipeline initialization
            this.summarizationPipeline = await withTimeout(
                initPromise,
                LOAD_TIMEOUT,
                'Model loading timed out after 60 seconds'
            );
            
            console.log('Summarization pipeline initialized successfully!');
            

        } catch (error: unknown) {
            console.error('Error initializing pipeline:', error);
            
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying initialization (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return this.initialize(retryCount + 1);
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to initialize summarization pipeline after ${MAX_RETRIES} attempts: ${errorMessage}`);
        }
    }

    public async summarize(text: string): Promise<string> {
        if (!text.trim()) {
            return '';
        }

        if (!this.summarizationPipeline) {
            await this.initialize();
        }

        try {
            if (!this.summarizationPipeline) {
                throw new Error('Summarization pipeline not initialized');
            }

            const result = await withTimeout(
                this.summarizationPipeline(text, {
                    max_length: 130,
                    min_length: 30,
                    max_time: 10, // Limit processing time to 10 seconds
                }),
                15000, // 15 seconds timeout for summarization
                'Summarization timed out after 15 seconds'
            );
            
            const summary = Array.isArray(result) ? result[0] : result;
            if (!summary || typeof summary !== 'object' || !('summary_text' in summary)) {
                throw new Error('Invalid summarization result');
            }

            return summary.summary_text;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error during summarization:', errorMessage);
            throw new Error(`Failed to summarize text: ${errorMessage}`);
        }
    }
}