import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js to use WASM
env.backends.onnx.wasm.numThreads = 1;

// Define types for pipeline results
type SummarizerPipeline = (text: string, options: { max_length: number; min_length: number }) => Promise<Array<{ summary_text: string }>>;
type TextAnalyzerPipeline = (text: string) => Promise<Array<{ label: string; score: number }>>;

class AIService {
  private summarizer: SummarizerPipeline | null = null;
  private textAnalyzer: TextAnalyzerPipeline | null = null;

  async initializeSummarizer(): Promise<SummarizerPipeline> {
    if (!this.summarizer) {
      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6') as SummarizerPipeline;
    }
    return this.summarizer;
  }

  async initializeTextAnalyzer(): Promise<TextAnalyzerPipeline> {
    if (!this.textAnalyzer) {
      this.textAnalyzer = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english') as TextAnalyzerPipeline;
    }
    return this.textAnalyzer;
  }

  async summarizeText(text: string): Promise<string> {
    try {
      const summarizer = await this.initializeSummarizer();
      const result = await summarizer(text, {
        max_length: 130,
        min_length: 30,
      });
      return result[0].summary_text;
    } catch (error) {
      console.error('Error summarizing text:', error);
      throw error;
    }
  }

  async analyzeText(text: string): Promise<{label: string, score: number}> {
    try {
      const analyzer = await this.initializeTextAnalyzer();
      const result = await analyzer(text);
      return result[0];
    } catch (error) {
      console.error('Error analyzing text:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();