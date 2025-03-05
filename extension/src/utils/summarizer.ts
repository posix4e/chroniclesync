import { pipeline, env, SummarizationPipeline } from '@xenova/transformers';

// Configure transformers.js settings
env.useBrowserCache = true;
env.allowLocalModels = false;

// Set up paths
const wasmDir = chrome.runtime.getURL('onnx/');
env.backends.onnx.wasm.wasmPaths = wasmDir;

// Configure model loading settings
env.localModelPath = chrome.runtime.getURL('models');
env.allowRemoteModels = true;
env.useBrowserCache = true;

// Log configuration for debugging
console.log('Configuration:', {
    wasmDir,
    localModelPath: env.localModelPath,
    useBrowserCache: env.useBrowserCache,
    allowRemoteModels: env.allowRemoteModels
});

// Use a smaller, optimized model and set timeouts
const MODEL_NAME = 'Xenova/distilbart-cnn-6-6';
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

// Summarizer class implements the singleton pattern to ensure:
// 1. Only one instance of the model is loaded in memory
// 2. Thread-safe initialization using Promise
// 3. Proper cleanup and error handling
// 4. Lazy loading of the model only when first needed
export class Summarizer {
    private static instance: Summarizer | null = null;
    private static initializationPromise: Promise<void> | null = null;
    private summarizationPipeline: SummarizationPipeline | null = null;

    private constructor() {}

    public static async getInstance(): Promise<Summarizer> {
        if (!Summarizer.instance) {
            Summarizer.instance = new Summarizer();
            // Store the initialization promise to prevent multiple concurrent initializations
            if (!Summarizer.initializationPromise) {
                Summarizer.initializationPromise = Summarizer.instance.initialize();
            }
            await Summarizer.initializationPromise;
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

            console.log('Loading summarization model (this may take a while on first run)...', {
                modelName: MODEL_NAME,
                config: {
                    localModelPath: env.localModelPath,
                    useBrowserCache: env.useBrowserCache,
                    allowRemoteModels: env.allowRemoteModels
                }
            });

            const initPromise = pipeline('summarization', MODEL_NAME, {
                quantized: true,
                progress_callback: (progress: { status?: string; progress: number; message?: string }) => {
                    // Only log progress at 0% and every 100% increment
                    const roundedProgress = Math.floor(progress.progress * 100);
                    if (roundedProgress === 0 || roundedProgress % 100 === 0) {
                        console.log('Model loading progress:', {
                            status: progress.status,
                            progress: `${roundedProgress}%`,
                            message: progress.message
                        });
                    }
                }
            });

            // Add timeout to pipeline initialization
            this.summarizationPipeline = await withTimeout(
                initPromise,
                LOAD_TIMEOUT,
                'Model loading timed out after 60 seconds'
            );
            
            console.log('Summarization pipeline initialized successfully!');
            Summarizer.initializationPromise = null; // Clear the promise after successful initialization

        } catch (error: unknown) {
            console.error('Error initializing pipeline:', error);
            Summarizer.initializationPromise = null; // Clear the promise on error
            
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

        // Ensure initialization is complete
        if (!this.summarizationPipeline) {
            if (!Summarizer.initializationPromise) {
                Summarizer.initializationPromise = this.initialize();
            }
            await Summarizer.initializationPromise;
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