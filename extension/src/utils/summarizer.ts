import { pipeline, env, SummarizationPipeline } from '@xenova/transformers';

// Configure transformers.js settings
env.useBrowserCache = true;
env.allowLocalModels = false;
env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('onnx/');

// Use a smaller model and set timeouts
const MODEL_NAME = 'Xenova/bart-large-cnn';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const LOAD_TIMEOUT = 30000; // 30 seconds timeout

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

            let lastProgress = 0;
            const initPromise = pipeline('summarization', MODEL_NAME, {
                quantized: true,
                progress_callback: (progress: { progress: number }) => {
                    // progress.progress is between 0 and 1
                    const currentProgress = Math.round(progress.progress * 100);
                    // Only log if progress has changed significantly (>= 5%)
                    if (currentProgress >= lastProgress + 5 && currentProgress <= 100) {
                        console.log('Loading model:', currentProgress, '%');
                        lastProgress = currentProgress;
                    }
                }
            });

            // Add timeout to pipeline initialization
            this.summarizationPipeline = await withTimeout(
                initPromise,
                LOAD_TIMEOUT,
                'Model loading timed out after 30 seconds'
            );
            
            console.log('Summarization pipeline initialized successfully');
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
        console.log('Starting summarization...');
        
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

            console.log('Summarization complete');
            return summary.summary_text;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error during summarization:', errorMessage);
            throw new Error(`Failed to summarize text: ${errorMessage}`);
        }
    }
}