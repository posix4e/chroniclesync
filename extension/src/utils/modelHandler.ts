import { pipeline, Pipeline } from '@huggingface/transformers';

export class ModelHandler {
  private translationPipeline: Pipeline | null = null;
  private summarizationPipeline: Pipeline | null = null;

  async initialize(): Promise<void> {
    // Load small, optimized models
    // Initialize translation pipeline with a public model
    this.translationPipeline = await pipeline('translation', 
      'Xenova/m2m100_418M'  // Public model with good multilingual support
    );
    
    // Initialize summarization pipeline with a public model
    this.summarizationPipeline = await pipeline('summarization',
      'Xenova/distilbart-cnn-6-6' // Public model for summarization
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