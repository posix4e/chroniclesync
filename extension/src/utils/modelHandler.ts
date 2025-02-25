import { pipeline } from '@huggingface/transformers';

interface TranslationResult {
  translation_text: string;
}

interface SummarizationResult {
  summary_text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationPipelineFunction = (text: string, options: any) => Promise<TranslationResult[]>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SummarizationPipelineFunction = (text: string, options: any) => Promise<SummarizationResult[]>;

export class ModelHandler {
  private translationPipeline: TranslationPipelineFunction | null = null;
  private summarizationPipeline: SummarizationPipelineFunction | null = null;

  async initialize(): Promise<void> {
    // Load small, optimized models
    this.translationPipeline = await pipeline('translation', 
      'Xenova/nllb-200-distilled-600M-int8'  // Quantized model for efficiency
    ) as unknown as TranslationPipelineFunction;
    
    this.summarizationPipeline = await pipeline('summarization',
      'Xenova/distilbart-cnn-6-6-int8' // Quantized model for efficiency  
    ) as unknown as SummarizationPipelineFunction;
  }

  async translate(text: string, targetLang: string): Promise<string> {
    if (!this.translationPipeline) {
      throw new Error('Translation pipeline not initialized');
    }

    const result = await this.translationPipeline(text, {
      src_lang: 'eng_Latn',
      tgt_lang: targetLang
    });
    return result[0].translation_text;
  }

  async summarize(text: string): Promise<string> {
    if (!this.summarizationPipeline) {
      throw new Error('Summarization pipeline not initialized');
    }

    const result = await this.summarizationPipeline(text, {
      max_length: 130,
      min_length: 30
    });
    return result[0].summary_text;
  }
}

// Export singleton instance
export const modelHandler = new ModelHandler();