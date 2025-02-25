import { pipeline } from '@huggingface/transformers';

// Use any for now since the types from the package are not properly exported
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pipeline = any;

export class ModelHandler {
  private translationPipeline: Pipeline | null = null;
  private summarizationPipeline: Pipeline | null = null;

  async initialize(): Promise<void> {
    // Load small, optimized models
    this.translationPipeline = await pipeline('translation', 
      'Xenova/nllb-200-distilled-600M-int8'  // Quantized model for efficiency
    );
    
    this.summarizationPipeline = await pipeline('summarization',
      'Xenova/distilbart-cnn-6-6-int8' // Quantized model for efficiency  
    );
  }

  async translate(text: string, targetLang: string): Promise<string> {
    if (!this.translationPipeline) {
      throw new Error('Translation pipeline not initialized');
    }

    const result = await this.translationPipeline(text, {
      src_lang: 'eng_Latn', 
      tgt_lang: targetLang
    });

    return Array.isArray(result) ? result[0].translation_text : result.translation_text;
  }

  async summarize(text: string): Promise<string> {
    if (!this.summarizationPipeline) {
      throw new Error('Summarization pipeline not initialized');
    }

    const result = await this.summarizationPipeline(text, {
      max_length: 130,
      min_length: 30
    });

    return Array.isArray(result) ? result[0].summary_text : result.summary_text;
  }
}

// Export singleton instance
export const modelHandler = new ModelHandler();