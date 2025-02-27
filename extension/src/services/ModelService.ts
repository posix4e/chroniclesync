import * as tf from '@tensorflow/tfjs';
import { SummaryModelConfig } from '../types/summary';

export class ModelService {
  private model: tf.LayersModel | null = null;
  private config: SummaryModelConfig;
  private isLoading = false;

  constructor(config: SummaryModelConfig) {
    this.config = config;
  }

  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return;

    try {
      this.isLoading = true;
      console.log('[Model] Loading model from:', this.config.modelUrl);
      this.model = await tf.loadLayersModel(this.config.modelUrl);
      console.log('[Model] Model loaded successfully');
    } catch (error) {
      console.error('[Model] Error loading model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async generateSummary(text: string): Promise<string> {
    if (!this.model) {
      await this.loadModel();
    }

    try {
      console.log('[Model] Generating summary');
      const input = this.preprocessText(text);
      const tensor = tf.tensor2d([input]);
      
      const predictions = await this.model!.predict(tensor) as tf.Tensor;
      const summary = await this.postprocessPredictions(predictions);
      
      tensor.dispose();
      predictions.dispose();
      
      return summary;
    } catch (error) {
      console.error('[Model] Error generating summary:', error);
      throw error;
    }
  }

  private preprocessText(text: string): number[] {
    // Simple preprocessing - convert to lowercase and pad/truncate
    const words = text.toLowerCase().split(/\s+/);
    const padded = words.slice(0, this.config.inputLength);
    while (padded.length < this.config.inputLength) {
      padded.push('');
    }
    return padded.map(word => this.wordToIndex(word));
  }

  private async postprocessPredictions(predictions: tf.Tensor): Promise<string> {
    const values = await predictions.data();
    const sentences = Array.from(values)
      .map((score, idx) => ({ score, idx }))
      .filter(item => item.score > this.config.threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.outputLength);

    return sentences.map(s => s.idx.toString()).join(' ');
  }

  private wordToIndex(word: string): number {
    // Simple vocabulary mapping - in practice, you'd use a proper tokenizer
    return word.length > 0 ? word.charCodeAt(0) % this.config.inputLength : 0;
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}